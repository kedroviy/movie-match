import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match, MatchUserStatus } from '@src/match/match.model';
import { Repository } from 'typeorm';
import { LikeMovieDto } from './dto/like-movie.dto';
import { RoomsService } from '@src/rooms/rooms.service';
import { Room, RoomStatus } from '@src/rooms/rooms.model';
import { RoomsGateway } from '@src/rooms/rooms.gateway';
import axios from 'axios';
import { URLS } from '@src/constants';
import { normalizeMovieDeck, parseMoviesColumn } from '@src/rooms/rooms.utils';
import { MatchPhase } from '@src/rooms/match-phase.enum';
import { RoomStateMachineService } from '@src/rooms/room-state-machine.service';
import { ExternalMovieCacheService } from '@src/movie/external-movie-cache.service';

@Injectable()
export class MatchService {
    private readonly checkStatusChains = new Map<string, Promise<void>>();

    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @Inject(RoomsService) private roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway,
        private readonly roomStateMachine: RoomStateMachineService,
        private readonly externalMovieCacheService: ExternalMovieCacheService,
    ) {}

    baseURL: string = URLS.kp_url;

    private describeExternalApiError(error: unknown): { kind: 'client' | 'server' | 'unknown'; message: string } {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const statusText = error.response?.statusText;
            const data = error.response?.data as any;
            const upstreamMessage =
                typeof data === 'string'
                    ? data
                    : typeof data?.message === 'string'
                      ? data.message
                      : typeof data?.error === 'string'
                        ? data.error
                        : undefined;
            const message = `Kinopoisk API error${status ? ` ${status}` : ''}${statusText ? ` ${statusText}` : ''}${
                upstreamMessage ? `: ${upstreamMessage}` : ''
            }`;
            if (typeof status === 'number' && status >= 400 && status < 500) {
                return { kind: 'client', message };
            }
            if (typeof status === 'number' && status >= 500) {
                return { kind: 'server', message };
            }
            return { kind: 'unknown', message };
        }
        if (error instanceof Error) {
            return { kind: 'unknown', message: error.message };
        }
        return { kind: 'unknown', message: 'Unknown error calling external API' };
    }

    private parseRoomFilters(raw: unknown): any {
        if (raw == null || raw === '') {
            return {};
        }
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch {
                return {};
            }
        }
        if (typeof raw === 'object') {
            return raw;
        }
        return {};
    }

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

    private async runCheckAndBroadcastIfNeeded(
        roomKey: string,
        userId: number,
        idempotencyKey?: string,
    ): Promise<void> {
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
                    const filters = this.parseRoomFilters(room.filters);

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
        const allMovieIds = matches.map((m) =>
            (m.movieId ?? []).map((raw) => Number(raw)).filter((n) => !Number.isNaN(n)),
        );

        if (allMovieIds.length === 0) return [];

        const [first, ...rest] = allMovieIds;
        const commonIds = first.filter((id) => rest.every((arr) => arr.some((x) => Number(x) === Number(id))));

        return commonIds;
    }

    async updateRoomMovies(roomKey: string, commonMovieIds: number[]) {
        const room = await this.roomRepository.findOne({ where: { key: roomKey } });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (commonMovieIds.length === 1) {
            this.roomStateMachine.assertEnterFinalPick(room);
            const movie = await this.fetchMovieById(Number(commonMovieIds[0]));
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
            const deck = normalizeMovieDeck(raw);
            if (!deck) {
                throw new ConflictException('Room deck has invalid shape');
            }
            const commonNumeric = commonMovieIds.map((id) => Number(id));
            const filteredMovies = deck.docs.filter((movie) => {
                if (typeof movie !== 'object' || movie === null) return false;
                const id = Reflect.get(movie, 'id');
                const numeric = typeof id === 'number' ? id : Number(id);
                return Number.isFinite(numeric) && commonNumeric.includes(numeric);
            });
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
        const headers = { 'X-API-KEY': URLS.kp_key };

        try {
            return await this.externalMovieCacheService.getOrFetchByUrl(url, headers);
        } catch (error) {
            const described = this.describeExternalApiError(error);
            console.error('fetchMoviesFromIds external API failed', { url, described });
            if (described.kind === 'client') {
                throw new BadRequestException(described.message);
            }
            throw new InternalServerErrorException(described.message);
        }
    }

    async fetchMovieById(id: number): Promise<any> {
        const url = `https://api.poiskkino.dev/v1.4/movie/${id}`;
        const headers = { 'X-API-KEY': URLS.kp_key };

        try {
            const data = await this.externalMovieCacheService.getOrFetchByUrl(url, headers);
            return (data as any)?.docs;
        } catch (error) {
            const described = this.describeExternalApiError(error);
            console.error('fetchMovieById external API failed', { url, described });
            if (described.kind === 'client') {
                throw new BadRequestException(described.message);
            }
            throw new InternalServerErrorException(described.message);
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
