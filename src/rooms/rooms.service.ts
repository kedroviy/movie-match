import {
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from '@src/rooms/rooms.model';
import { Match, MatchUserStatus } from '@src/match/match.model';
import { UserService } from '@src/user/user.service';
import { RoomsGateway } from './rooms.gateway';
import { constructUrl } from './rooms.utils';
import { RoomState } from './rooms.interface';
import axios from 'axios';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly userService: UserService,
        @Inject(forwardRef(() => RoomsGateway))
        private readonly roomsGateway: RoomsGateway,
    ) { }

    private roomStates = new Map<string, RoomState>();
    private readonly API_KEY: string = process.env.API_KEY_KINO;

    async createRoom(userId: number, name?: string, filters?: any): Promise<Match> {
        const existingRoom = await this.getUsersRooms(userId);
        if (existingRoom) {
            throw new ConflictException('Room already exists for this user');
        }
        console.log(existingRoom, userId);
        const key = this.generateKey();

        const newRoom = this.roomRepository.create({
            authorId: userId,
            key,
            name,
            status: RoomStatus.WAITING,
            filters,
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
        this.roomsGateway.notifyRoomJoined(roomUser);
        return {
            ...roomUser,
        };
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
            this.roomsGateway.notifyRoomJoined(roomUser);
        }

        await this.matchRepository.save(roomUser);

        const matchesInRoom = await this.getMatchesInRoom(key);
        this.roomsGateway.handleRequestMatchData({
            type: 'matchUpdated',
            roomKey: key,
            matches: matchesInRoom,
        });

        return matchesInRoom;
    }

    async updateRoomFilters(userId: string, roomId: string, filters: any): Promise<any> {
        console.log('userId: ', userId, 'roomId: ', roomId, 'filters: ', filters);
        const room = await this.roomRepository.findOneBy({ id: roomId });

        console.log('room: ', userId);
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

        await this.roomsGateway.broadcastFilters(roomKey, filters);

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

        let filters;
        try {
            filters = JSON.parse(room.filters);
        } catch (error) {
            throw new ConflictException('Failed to parse filters');
        }

        const safeFilters = {
            excludeGenre: filters?.excludeGenre ?? [],
            genres: filters?.genres ?? [],
            selectedYears: filters?.selectedYears ?? [],
            selectedGenres: filters?.selectedGenres ?? [],
            selectedCountries: filters?.selectedCountries ?? [],
        };

        const baseURL = process.env.URL_KINOPOISK;
        console.log(baseURL);
        if (!baseURL) {
            throw new InternalServerErrorException('Base URL for Kinopoisk API is not defined');
        }
        const url = constructUrl(baseURL, safeFilters, 1);

        const config = {
            headers: {
                'X-API-KEY': this.API_KEY,
            },
        };

        try {
            const response = await axios.get(url, config);
            const data = response.data;

            room.movies = JSON.stringify(data);
            await this.roomRepository.save(room);

            await this.roomsGateway.broadcastMoviesList('Get data!');
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }

        return { status: 'success' };
    }

    async fetchAndSaveMovies(room: Room, filters: any): Promise<any> {
        const safeFilters = {
            excludeGenre: filters?.excludeGenre ?? [],
            genres: filters?.genres ?? [],
            selectedYears: filters?.selectedYears ?? [],
            selectedGenres: filters?.selectedGenres ?? [],
            selectedCountries: filters?.selectedCountries ?? [],
        };

        const baseURL = process.env.URL_KINOPOISK;
        const currentPage = room.currentPage;
        const url = constructUrl(baseURL, safeFilters, currentPage);

        const config = {
            headers: {
                'X-API-KEY': this.API_KEY,
            },
        };

        try {
            const response = await axios.get(url, config);
            const data = response.data;

            room.movies = JSON.stringify(data);
            room.currentPage = currentPage + 1;

            await this.roomRepository.save(room);

            await this.roomsGateway.broadcastMoviesList('Get data!');
        } catch (error) {
            console.log(error);
            throw new Error('Failed to fetch data from external API');
        }
    }

    async getNextMovie(roomKey: string): Promise<string> {
        const room = await this.roomRepository.findOne({ where: { key: roomKey } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const matchMovies = room.movies;
        if (!matchMovies || matchMovies.length === 0) {
            throw new NotFoundException('No movies found for this user in the specified room');
        }

        try {
            console.log('movies: ', matchMovies);

            return await matchMovies;
        } catch (error) {
            console.error('Error in getNextMovie:', error);
            throw new InternalServerErrorException('Error fetching movies');
        }
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
        this.roomsGateway.broadcastMoviesList(currentMovie);
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

    async deleteRoom(key: string): Promise<void> {
        const room = await this.roomRepository.findOne({ where: { key } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        await this.roomRepository.remove(room);
    }

    async getRoomDetails(roomId: string): Promise<any> {
        const room = await this.roomRepository.findOne({
            where: { key: roomId },
            relations: ['users'],
        });

        if (!room) {
            throw new NotFoundException('Комната не найдена');
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

    private generateKey(): string {
        return String(Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000);
    }

    private async getUsersRooms(userId: number): Promise<Room> {
        return this.roomRepository.findOne({
            where: { authorId: userId },
        });
    }
}
