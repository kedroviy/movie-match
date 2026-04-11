import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match, MatchUserStatus } from '@src/match/match.model';
import { Repository } from 'typeorm';
import { LikeMovieDto } from './dto/like-movie.dto';
import { RoomsService } from '@src/rooms/rooms.service';
import { Room, RoomStatus } from '@src/rooms/rooms.model';
import { RoomsGateway } from '@src/rooms/rooms.gateway';
import axios from 'axios';
import { URLS } from '@src/constants';
import { parseMoviesColumn } from '@src/rooms/rooms.utils';
import { MatchPhase } from '@src/rooms/match-phase.enum';
import { RoomStateMachineService } from '@src/rooms/room-state-machine.service';

@Injectable()
export class MatchService {
    private readonly checkStatusChains = new Map<string, Promise<void>>();

    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @Inject(RoomsService) private roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway,
        private readonly roomStateMachine: RoomStateMachineService,
    ) {}

    baseURL: string = URLS.kp_url;

    /** Idempotent: duplicate like for same movie returns success without error. */
    async likeMovie(likeMovieDto: LikeMovieDto): Promise<string> {
        const { roomKey, userId, movieId } = likeMovieDto;
        const room = await this.roomRepository.findOneBy({ key: roomKey });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        let match = await this.matchRepository.findOne({ where: { roomKey, userId } });

        if (!match) {
            match = this.matchRepository.create({
                roomKey,
                userId,
                movieId: [movieId],
            });
        } else {
            if (!match.movieId) {
                match.movieId = [];
            }
            if (match.movieId.includes(movieId)) {
                return 'Movie liked successfully';
            }
            match.movieId.push(movieId);
        }

        await this.matchRepository.save(match);

        return 'Movie liked successfully';
    }

    async getUserStatusByUserId(roomKey: string, userId: number): Promise<string | null> {
        const match = await this.matchRepository.findOne({ where: { roomKey, userId } });
        return match ? match.userStatus : null;
    }

    async updateUserStatus(roomKey: string, userId: number, userStatus: string): Promise<string> {
        const match = await this.matchRepository.findOne({ where: { roomKey, userId } });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        match.userStatus = userStatus;

        await this.matchRepository.save(match);

        return 'User status updated successfully';
    }

    async updateAllUsersStatusToActive(roomKey: string): Promise<void> {
        const matches = await this.matchRepository.find({ where: { roomKey } });
        for (const match of matches) {
            match.userStatus = MatchUserStatus.ACTIVE;
            await this.matchRepository.save(match);
        }
    }

    /**
     * Serialize per-room so two devices finishing the deck at once do not double-fetch
     * the next Kinopoisk page or double-broadcast.
     */
    async checkAndBroadcastIfNeeded(roomKey: string, userId: number, idempotencyKey?: string): Promise<void> {
        const previous = this.checkStatusChains.get(roomKey) ?? Promise.resolve();
        const current = previous.then(() => this.runCheckAndBroadcastIfNeeded(roomKey, userId, idempotencyKey));
        this.checkStatusChains.set(roomKey, current);
        try {
            await current;
        } finally {
            if (this.checkStatusChains.get(roomKey) === current) {
                this.checkStatusChains.delete(roomKey);
            }
        }
    }

    private async runCheckAndBroadcastIfNeeded(roomKey: string, userId: number, idempotencyKey?: string): Promise<void> {
        const match = await this.matchRepository.findOne({ where: { roomKey, userId } });
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        const room = await this.roomRepository.findOneBy({ key: roomKey });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (
            idempotencyKey &&
            room.deckRoundIdempotencyKey === idempotencyKey &&
            room.deckRoundIdempotencyAtVersion === room.aggregateVersion
        ) {
            return;
        }

        const versionBefore = room.aggregateVersion ?? 0;

        match.userStatus = MatchUserStatus.WAITING;
        await this.matchRepository.save(match);

        const matches = await this.matchRepository.find({ where: { roomKey } });
        const allUsersWaiting = matches.every((m) => m.userStatus === MatchUserStatus.WAITING);

        if (allUsersWaiting || matches.length === 1) {
            if (room.status === RoomStatus.SET) {
                const commonMovieIds = await this.getCommonMovieIds(roomKey);
                if (commonMovieIds.length >= 8) {
                    this.roomStateMachine.assertEnterExceptionShortlist(room);
                    const moviesData = await this.fetchMoviesFromIds(this.baseURL, commonMovieIds);
                    room.movies = moviesData;
                    room.status = RoomStatus.EXCEPTION;
                    room.matchPhase = MatchPhase.SWIPING;
                    room.aggregateVersion = (room.aggregateVersion ?? 0) + 1;
                    await this.roomRepository.save(room);

                    for (const m of matches) {
                        m.movieId = [];
                        await this.matchRepository.save(m);
                    }

                    await this.roomsGateway.broadcastMoviesList('Movies data updated', roomKey, {
                        aggregateVersion: room.aggregateVersion,
                        matchPhase: room.matchPhase,
                    });
                } else {
                    let filters;
                    try {
                        filters = JSON.parse(room.filters);
                    } catch (error) {
                        throw new ConflictException('Failed to parse filters');
                    }

                    this.roomStateMachine.assertFetchNextDeck(room);
                    await this.roomsService.fetchAndSaveMovies(room, filters);
                    await this.updateAllUsersStatusToActive(roomKey);
                }
            } else if (room.status === RoomStatus.EXCEPTION) {
                const commonMovieIds = await this.getCommonMovieIds(roomKey);

                if (commonMovieIds.length > 0) {
                    await this.updateRoomMovies(roomKey, commonMovieIds);
                    await this.clearMatchMovieIds(roomKey);
                } else {
                    await this.roomsGateway.broadcastMoviesList('Movies data updated', roomKey, {
                        aggregateVersion: room.aggregateVersion,
                        matchPhase: room.matchPhase,
                    });
                }
            }
        }

        if (idempotencyKey) {
            const latest = await this.roomRepository.findOneBy({ key: roomKey });
            if (latest && (latest.aggregateVersion ?? 0) > versionBefore) {
                latest.deckRoundIdempotencyKey = idempotencyKey;
                latest.deckRoundIdempotencyAtVersion = latest.aggregateVersion;
                await this.roomRepository.save(latest);
            }
        }
    }

    private async getCommonMovieIds(roomKey: string): Promise<number[]> {
        const matches = await this.matchRepository.find({ where: { roomKey } });
        const allMovieIds = matches.map((m) => (m.movieId ?? []).map(Number));

        if (allMovieIds.length === 0) return [];

        const [first, ...rest] = allMovieIds;
        const commonIds = first.filter((id) => rest.every((array) => array.includes(id)));

        return commonIds;
    }

    async updateRoomMovies(roomKey: string, commonMovieIds: number[]) {
        const room = await this.roomRepository.findOne({ where: { key: roomKey } });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (commonMovieIds.length === 1) {
            this.roomStateMachine.assertEnterFinalPick(room);
            const movie = await this.fetchMovieById(commonMovieIds[0]);
            room.movies = { docs: movie, total: Array.isArray(movie) ? movie.length : 0 };
            room.matchPhase = MatchPhase.FINAL_PICK;
            room.aggregateVersion = (room.aggregateVersion ?? 0) + 1;
            await this.roomRepository.save(room);
            await this.roomsGateway.broadcastMoviesList('Final movie selected', roomKey, {
                aggregateVersion: room.aggregateVersion,
                matchPhase: room.matchPhase,
            });
            await this.roomsService.deleteRoom(roomKey);
        } else {
            this.roomStateMachine.assertNarrowExceptionDeck(room);
            const raw = parseMoviesColumn(room.movies) ?? room.movies;
            const deck = Array.isArray(raw) ? { docs: raw } : raw;
            if (!deck?.docs) {
                throw new ConflictException('Room deck has invalid shape');
            }
            const filteredMovies = deck.docs.filter((movie: any) => commonMovieIds.includes(movie.id));
            const updatedMoviesData = {
                ...deck,
                docs: filteredMovies,
                total: filteredMovies.length,
            };
            room.movies = updatedMoviesData;
            room.matchPhase = MatchPhase.SWIPING;
            room.aggregateVersion = (room.aggregateVersion ?? 0) + 1;

            await this.roomRepository.save(room);
            await this.roomsGateway.broadcastMoviesList('Movies data updated', roomKey, {
                aggregateVersion: room.aggregateVersion,
                matchPhase: room.matchPhase,
            });
        }
    }

    async clearMatchMovieIds(roomKey: string) {
        const matches = await this.matchRepository.find({ where: { roomKey } });

        for (const match of matches) {
            match.movieId = [];
            await this.matchRepository.save(match);
        }
    }

    async fetchMoviesFromIds(baseURL: string, ids: number[]): Promise<any> {
        const url = `${baseURL}page=1&limit=10&${ids.map((id) => `id=${id}`).join('&')}`;
        const config = {
            headers: {
                'X-API-KEY': URLS.kp_key,
            },
        };

        try {
            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }
    }

    async fetchMovieById(id: number): Promise<any> {
        const url = `https://api.kinopoisk.dev/v1.4/movie/${id}`;
        const config = {
            headers: {
                'X-API-KEY': URLS.kp_key,
            },
        };

        try {
            const response = await axios.get(url, config);
            return response.data.docs;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }
    }

    async getCurrentMatchData(roomKey: string): Promise<Match[]> {
        const matches = await this.matchRepository.find({ where: { roomKey } });

        if (matches.length === 0) {
            throw new NotFoundException('Match not found');
        }
        return matches;
    }

    async findByUserId(userId: number): Promise<Match | null> {
        try {
            return (await this.matchRepository.findOne({ where: { userId } })) || null;
        } catch (error) {
            console.error('Error finding match by userId:', error);
            return null;
        }
    }
}
