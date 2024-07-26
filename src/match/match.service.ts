import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match, MatchUserStatus } from '@src/match/match.model';
import { Repository } from 'typeorm';
import { LikeMovieDto } from './dto/like-movie.dto';
import { RoomsService } from '@src/rooms/rooms.service';
import { Room } from '@src/rooms/rooms.model';
import { RoomsGateway } from '@src/rooms/rooms.gateway';
import axios from 'axios';
import { URLS } from '@src/constants';

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @Inject(RoomsService) private roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway,
    ) {}

    baseURL: string = URLS.kp_url;

    async likeMovie(likeMovieDto: LikeMovieDto): Promise<string> {
        const { roomKey, userId, movieId } = likeMovieDto;
        const room = await this.roomRepository.findOneBy({ key: roomKey });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        console.log('room: ', room);

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
                throw new ConflictException('Movie already liked');
            }
            match.movieId.push(movieId);
        }

        await this.matchRepository.save(match);

        // if (match.userStatus === MatchUserStatus.WAITING) {
        //     if (room.status === RoomStatus.SET) {
        //         await this.checkAndBroadcastIfNeeded(roomKey, userId);
        //     } else if (room.status === RoomStatus.EXCEPTION) {
        //         await this.checkAndProcessMatchedMovies(roomKey, userId);
        //     }
        // }

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

    async checkAndBroadcastIfNeeded(roomKey: string, userId: number): Promise<void> {
        const match = await this.matchRepository.findOne({ where: { roomKey, userId } });
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        const room = await this.roomRepository.findOneBy({ key: roomKey });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        match.userStatus = MatchUserStatus.WAITING;
        await this.matchRepository.save(match);

        const matches = await this.matchRepository.find({ where: { roomKey } });

        const allUsersWaiting = matches.every((match) => match.userStatus === MatchUserStatus.WAITING);

        if (allUsersWaiting || matches.length === 1) {
            const room = await this.roomRepository.findOneBy({ key: roomKey });
            if (!room) {
                throw new NotFoundException('Room not found');
            }

            let filters;
            try {
                filters = JSON.parse(room.filters);
            } catch (error) {
                throw new ConflictException('Failed to parse filters');
            }

            await this.roomsService.fetchAndSaveMovies(room, filters);
            await this.updateAllUsersStatusToActive(roomKey);
            await this.roomsGateway.broadcastMoviesList('Get next page movies');
        }

        const commonMovieIds = await this.getCommonMovieIds(roomKey);
        if (commonMovieIds.length >= 8) {
            await this.fetchAndSaveMoviesData(roomKey, commonMovieIds);
            await this.roomsGateway.broadcastMoviesList('Movies data updated');
        }
    }

    // private async checkAndProcessMatchedMovies(roomKey: string, userId: number): Promise<void> {
    //     const match = await this.matchRepository.findOne({ where: { roomKey, userId } });
    //     if (!match) {
    //         throw new NotFoundException('Match not found');
    //     }

    //     const commonMovieIds = await this.getCommonMovieIds(roomKey);
    //     if (commonMovieIds.length === 1) {
    //         await this.roomsGateway.broadcastMoviesList('Final movie selected');
    //     } else {
    //         await this.fetchAndSaveMoviesData(roomKey, commonMovieIds);
    //         await this.roomsGateway.broadcastMoviesList('Movies data updated');
    //     }
    // }

    async getCurrentMatchData(roomKey: string): Promise<Match> {
        const match = await this.matchRepository.findOne({ where: { roomKey } });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return match;
    }

    private async getCommonMovieIds(roomKey: string): Promise<string[]> {
        const matches = await this.matchRepository.find({ where: { roomKey } });

        const movieIdCounts: Record<string, number> = {};

        for (const match of matches) {
            const movieIds = Array.isArray(match.movieId) ? match.movieId : [match.movieId];

            for (const movieId of movieIds) {
                console.log('match.movieId: ', movieIds);
                if (movieIdCounts[movieId]) {
                    movieIdCounts[movieId]++;
                } else {
                    movieIdCounts[movieId] = 1;
                }
            }
        }

        const commonMovieIds = Object.keys(movieIdCounts).filter((movieId) => movieIdCounts[movieId] >= 8);

        return commonMovieIds;
    }

    async fetchMoviesFromIds(baseURL: string, ids: string[]): Promise<any> {
        const url = `${baseURL}/v1.4/movie?page=1&limit=10&${ids.map((id) => `id=${id}`).join('&')}`;
        const response = await axios.get(url);
        return response.data;
    }

    private async fetchAndSaveMoviesData(roomKey: string, movieIds: string[]): Promise<void> {
        const moviesData = await this.fetchMoviesFromIds(this.baseURL, movieIds);

        const room = await this.roomRepository.findOneBy({ key: roomKey });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        room.movies = moviesData;
        await this.roomRepository.save(room);
    }
}
