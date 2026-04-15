import {
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Room, RoomStatus } from '@src/rooms/rooms.model';
import { Match, MatchUserStatus } from '@src/match/match.model';
import { UserService } from '@src/user/user.service';
import { RoomsGateway } from './rooms.gateway';
import { constructUrl, normalizeMovieDeck, parseMoviesColumn } from './rooms.utils';
import { RoomState } from './rooms.interface';
import axios from 'axios';
import 'dotenv/config';
import { URLS } from '@src/constants';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalMovieCacheService, SafeMovieFilters } from '@src/movie/external-movie-cache.service';
import { MatchPhase } from './match-phase.enum';
import { RoomStateMachineService } from './room-state-machine.service';
import { RoomStateDto } from './dto/room-state.dto';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly userService: UserService,
        @Inject(forwardRef(() => RoomsGateway))
        private readonly roomsGateway: RoomsGateway,
        private readonly externalMovieCacheService: ExternalMovieCacheService,
        private readonly roomStateMachine: RoomStateMachineService,
    ) {}

    private roomStates = new Map<string, RoomState>();
    private readonly API_KEY: string = process.env.API_KEY_KINO;

    async createRoom(userId: number, name?: string, filters?: any): Promise<Match> {
        const existingRoom = await this.getUsersRooms(userId);
        if (existingRoom) {
            // Allow creating a fresh lobby: remove the previous authored room (matches + room row).
            await this.deleteRoom(existingRoom.key);
        }
        const key = this.generateKey();

        const newRoom = this.roomRepository.create({
            authorId: userId,
            key,
            name,
            status: RoomStatus.PENDING,
            filters,
            matchPhase: MatchPhase.LOBBY,
            aggregateVersion: 0,
        });

        await this.roomRepository.save(newRoom);
        const user = await this.userService.getUserById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const roomUser: Match = this.matchRepository.create({
            userId: userId,
            roomId: newRoom.id,
            userName: user.username,
            roomKey: newRoom.key,
            role: 'admin',
            userStatus: MatchUserStatus.ACTIVE,
        });

        await this.matchRepository.save(roomUser);

        return { ...roomUser };
    }

    /** Runs once per day; removes inactive rooms older than 24 hours. */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupOldRooms(): Promise<void> {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const roomsToDelete = await this.roomRepository.find({
            where: {
                createdAt: LessThan(cutoffTime),
            },
            relations: ['matches'],
        });

        for (const room of roomsToDelete) {
            await this.matchRepository.remove(room.matches);
            await this.roomRepository.remove(room);
        }

        console.log(`Deleted ${roomsToDelete.length} rooms older than 24 hours`);
        await this.externalMovieCacheService.purgeExpired();
    }

    async joinRoom(userId: number, key: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key }, relations: ['users'] });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const existingUser = await this.matchRepository.findOne({
            where: { userId, roomId: room.id },
        });

        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        let roomUser;

        if (existingUser) {
            roomUser = existingUser;
        } else {
            roomUser = this.matchRepository.create({
                userId: userId,
                roomId: room.id,
                userName: user.username,
                roomKey: room.key,
                role: 'participant',
                userStatus: MatchUserStatus.ACTIVE,
            });
            await this.matchRepository.save(roomUser);
            // this.roomsGateway.notifyRoomJoined(roomUser);
        }

        const matchesInRoom = await this.getMatchesInRoom(key);
        this.roomsGateway.broadcastMatchDataUpdate('Match Room Updated', key);

        return matchesInRoom;
    }

    async updateRoomFilters(userId: string, roomId: string, filters: any): Promise<any> {
        console.log('userId: ', userId, 'roomId: ', roomId, 'filters: ', filters);
        const room = await this.roomRepository.findOneBy({ id: roomId });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const matches = await this.matchRepository.find({
            where: { roomId: roomId },
        });

        if (matches.length === 0) {
            throw new NotFoundException('No matches found in room');
        }

        const roomKey = matches[0]?.roomKey;
        room.filters = JSON.stringify(filters);

        await this.roomRepository.save(room);
        console.log('Filters saved:', room.filters);
        await this.roomsGateway.emitFiltersUpdated(roomKey, filters);

        return { message: 'Filters successfully updated.' };
    }

    async getRoomFilters(key: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        let filters;
        try {
            filters = JSON.parse(room.filters);
        } catch (error) {
            throw new ConflictException('Failed to parse filters');
        }

        return filters;
    }

    async startMatch(key: string): Promise<any> {
        const room = await this.roomRepository.findOneBy({ key });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        this.roomStateMachine.assertStartMatch(room);
        if (!(room.matchPhase === MatchPhase.LOBBY && room.status === RoomStatus.PENDING)) {
            return { status: 'already_started' };
        }

        let filters;
        try {
            filters = JSON.parse(room.filters);
        } catch (error) {
            throw new ConflictException('Failed to parse filters');
        }

        const safeFilters = this.toSafeFilters(filters);

        const baseURL: string = URLS.kp_url;
        const currentPage: number = room.currentPage;
        if (!baseURL) {
            throw new InternalServerErrorException('Base URL for Kinopoisk API is not defined');
        }
        const url = constructUrl(baseURL, safeFilters as any, currentPage);

        const headers = { 'X-API-KEY': URLS.kp_key };

        try {
            const data = await this.externalMovieCacheService.getOrFetch(url, safeFilters, currentPage, headers);

            room.movies = data;
            room.currentPage = currentPage + 1;
            room.status = RoomStatus.SET;
            room.matchPhase = MatchPhase.SWIPING;
            room.aggregateVersion = (room.aggregateVersion ?? 0) + 1;
            await this.roomRepository.save(room);
            await this.roomsGateway.broadcastMoviesList('Movies data updated', key, {
                aggregateVersion: room.aggregateVersion,
                matchPhase: room.matchPhase,
            });
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }

        return { status: 'started' };
    }

    async fetchAndSaveMovies(room: Room, filters: any): Promise<any> {
        this.roomStateMachine.assertFetchNextDeck(room);

        const safeFilters = this.toSafeFilters(filters);

        const baseURL: string = URLS.kp_url;
        const currentPage: number = room.currentPage;
        if (!baseURL) {
            throw new InternalServerErrorException('Base URL for Kinopoisk API is not defined');
        }
        const url = constructUrl(baseURL, safeFilters as any, currentPage);

        const headers = { 'X-API-KEY': URLS.kp_key };
        try {
            const data = await this.externalMovieCacheService.getOrFetch(url, safeFilters, currentPage, headers);

            room.movies = data;
            room.currentPage = currentPage + 1;
            room.matchPhase = MatchPhase.SWIPING;
            room.aggregateVersion = (room.aggregateVersion ?? 0) + 1;

            await this.roomRepository.save(room);

            await this.roomsGateway.broadcastMoviesList('Movies data updated', room.key, {
                aggregateVersion: room.aggregateVersion,
                matchPhase: room.matchPhase,
            });
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }
    }

    async getNextMovie(roomKey: string): Promise<Record<string, unknown>> {
        const room = await this.roomRepository.findOne({ where: { key: roomKey } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const rawDeck = parseMoviesColumn(room.movies) ?? room.movies;
        const deck = normalizeMovieDeck(rawDeck);
        const docs = deck?.docs;
        if (!docs?.length) {
            throw new NotFoundException('No movies found for this user in the specified room');
        }

        return {
            ...(deck ?? { docs }),
            _room: {
                roomKey: room.key,
                aggregateVersion: room.aggregateVersion ?? 0,
                matchPhase: room.matchPhase,
            },
        };
    }

    private sendNextMovieToRoom(key: string): void {
        const roomState = this.roomStates.get(key);
        if (!roomState) {
            throw new NotFoundException('Room state not found');
        }

        const currentMovie = roomState.movies[roomState.currentMovieIndex];
        if (!currentMovie) {
            this.fetchNextPage(key);
            return;
        }

        console.log('sendNextMovieToRoom: ', currentMovie);
        void this.emitBroadcastForRoom(key);
    }

    private async emitBroadcastForRoom(key: string): Promise<void> {
        const room = await this.roomRepository.findOneBy({ key });
        this.roomsGateway.broadcastMoviesList('Movies data updated', key, {
            aggregateVersion: room?.aggregateVersion ?? 0,
            matchPhase: room?.matchPhase,
        });
    }

    private async fetchNextPage(key: string): Promise<void> {
        const roomState = this.roomStates.get(key);
        if (!roomState) {
            throw new NotFoundException('Room state not found');
        }

        const filters = await this.getRoomFilters(key);
        const baseURL = process.env.URL_KINOPOISK;
        const nextPage = roomState.page + 1;
        const url = constructUrl(baseURL, filters, nextPage);

        const config = {
            headers: {
                'X-API-KEY': this.API_KEY,
            },
        };

        console.log('url for match: ', url);

        try {
            const response = await axios.get(url, config);
            console.log(response);
            const data = response.data;

            roomState.page = nextPage;
            roomState.currentMovieIndex = 0;
            roomState.movies = data.docs;
            roomState.votes.clear();

            this.sendNextMovieToRoom(key);
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }
    }

    async doesUserHaveRoom(
        userId: number,
    ): Promise<{ message: string; match?: Match[] } | { message: string; key?: string }> {
        console.log('call user');
        const room = await this.roomRepository.findOne({ where: { authorId: userId } });

        if (room) {
            const matches = await this.matchRepository.find({ where: { roomKey: room.key } });
            return { message: 'room exist', match: matches, key: room.key };
        } else {
            return { message: 'room not found' };
        }
    }

    async leaveFromRoom(key: string, userId: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key }, relations: ['users'] });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        room.users = room.users.filter((user: any) => user.id !== userId);
        await this.roomRepository.save(room);

        return { message: 'Left the room successfully' };
    }

    async leaveFromMatch(userId: number, roomKey: string): Promise<any> {
        const match = await this.matchRepository.findOne({
            where: { userId: userId, roomKey: roomKey },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        await this.matchRepository.remove(match);
        return { message: 'Successfully left the match' };
    }

    /** All `Match` rows for the user with joined `Room` metadata (author or participant). */
    async getUserRoomMemberships(userId: number): Promise<
        Array<{
            roomKey: string;
            roomId: string;
            role: string;
            isAuthor: boolean;
            userStatus: string;
            matchPhase: string;
            roomStatus: string;
            roomName: string | null;
        }>
    > {
        const matches = await this.matchRepository.find({
            where: { userId },
            order: { id: 'DESC' },
        });

        const results: Array<{
            roomKey: string;
            roomId: string;
            role: string;
            isAuthor: boolean;
            userStatus: string;
            matchPhase: string;
            roomStatus: string;
            roomName: string | null;
        }> = [];

        for (const m of matches) {
            const room = await this.roomRepository.findOne({ where: { key: m.roomKey } });
            if (!room) {
                continue;
            }

            results.push({
                roomKey: m.roomKey,
                roomId: String(room.id),
                role: m.role,
                isAuthor: room.authorId === userId,
                userStatus: m.userStatus,
                matchPhase: room.matchPhase,
                roomStatus: room.status,
                roomName: room.name ?? null,
            });
        }

        return results;
    }

    /**
     * Participant: removes only their `Match` row.
     * Room author: deletes the whole room (and all matches), same as `deleteRoom`.
     */
    async leaveRoomMembership(userId: number, roomKey: string): Promise<{ message: string }> {
        const room = await this.roomRepository.findOne({ where: { key: roomKey } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const match = await this.matchRepository.findOne({ where: { userId, roomKey } });
        if (!match) {
            throw new NotFoundException('You are not a member of this room');
        }

        if (room.authorId === userId) {
            await this.deleteRoom(roomKey);
        } else {
            await this.leaveFromMatch(userId, roomKey);
        }

        return { message: 'Successfully left the room' };
    }

    async deleteRoom(key: string): Promise<void> {
        const room = await this.roomRepository.findOne({ where: { key }, relations: ['matches'] });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (room.matches?.length) {
            await this.matchRepository.remove(room.matches);
        }
        await this.roomRepository.remove(room);
    }

    async getRoomDetails(roomId: string): Promise<any> {
        const room = await this.roomRepository.findOne({
            where: { key: roomId },
            relations: ['users'],
        });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        return room;
    }

    async getMatchesInRoom(roomKey: string): Promise<Match[]> {
        const matches = await this.matchRepository.find({
            where: { roomKey: roomKey },
        });

        return matches;
    }

    async getRoomByKey(key: string): Promise<Room> {
        return this.roomRepository.findOne({ where: { key }, relations: ['users', 'matches'] });
    }

    async getRoomAggregateState(key: string): Promise<RoomStateDto> {
        const room = await this.roomRepository.findOne({
            where: { key },
            relations: ['matches'],
        });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const matches = room.matches?.length ? room.matches : await this.getMatchesInRoom(key);
        const rawDeck = parseMoviesColumn(room.movies) ?? room.movies;
        const deck = normalizeMovieDeck(rawDeck);
        const docs = deck?.docs;
        const docCount = Array.isArray(docs) ? docs.length : 0;
        let firstMovieId: number | undefined;
        let lastMovieId: number | undefined;
        if (docCount > 0) {
            const first = docs?.[0];
            const last = docs?.[docCount - 1];
            if (typeof first === 'object' && first !== null) {
                const id = Reflect.get(first, 'id');
                const numeric = typeof id === 'number' ? id : Number(id);
                firstMovieId = Number.isFinite(numeric) ? numeric : undefined;
            }
            if (typeof last === 'object' && last !== null) {
                const id = Reflect.get(last, 'id');
                const numeric = typeof id === 'number' ? id : Number(id);
                lastMovieId = Number.isFinite(numeric) ? numeric : undefined;
            }
        }

        const participants = (matches ?? []).map((m) => ({
            userId: m.userId,
            userName: m.userName,
            role: m.role,
            userStatus: m.userStatus,
            likedCount: m.movieId?.length ?? 0,
        }));

        let hasFilters = false;
        try {
            hasFilters = Boolean(room.filters && JSON.parse(room.filters));
        } catch {
            hasFilters = Boolean(room.filters);
        }

        return {
            roomKey: room.key,
            roomId: room.id,
            matchPhase: room.matchPhase,
            roomStatus: room.status,
            aggregateVersion: room.aggregateVersion ?? 0,
            participants,
            deck: {
                docCount,
                firstMovieId,
                lastMovieId,
                hasDeck: docCount > 0,
            },
            hasFilters,
            serverTime: new Date().toISOString(),
        };
    }

    private toSafeFilters(filters: any): SafeMovieFilters {
        return {
            excludeGenre: filters?.excludeGenre ?? [],
            genres: filters?.genres ?? [],
            selectedYears: filters?.selectedYears ?? [],
            selectedGenres: filters?.selectedGenres ?? [],
            selectedCountries: filters?.selectedCountries ?? [],
            selectedRating: filters?.selectedRating ?? [],
        };
    }

    private generateKey(): string {
        return String(Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000);
    }

    private async getUsersRooms(userId: number): Promise<Room> {
        return this.roomRepository.findOne({
            where: { authorId: userId },
        });
    }
}
