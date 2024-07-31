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
            if (room.status === RoomStatus.SET) {
                const commonMovieIds = await this.getCommonMovieIds(roomKey);
                if (commonMovieIds.length >= 8) {
                    const moviesData = await this.fetchMoviesFromIds(this.baseURL, commonMovieIds);
                    room.movies = moviesData;
                    console.log('room.movies: ', room.movies);
                    console.log('room: ', room);
                    room.status = RoomStatus.EXCEPTION;
                    await this.roomRepository.save(room);

                    for (const match of matches) {
                        match.movieId = [];
                        await this.matchRepository.save(match);
                    }

                    await this.roomsGateway.broadcastMoviesList('Movies data updated');
                } else {
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
            } else if (room.status === RoomStatus.EXCEPTION) {
                const commonMovieIds = await this.getCommonMovieIds(roomKey);
                if (commonMovieIds.length > 0) {
                    console.log('movies room: ', room.movies);
                    room.movies = room.movies.docs.filter((movie: any) => commonMovieIds.includes(movie.id));
                    await this.roomRepository.save(room);

                    if (room.movies.total === 1) {
                        await this.roomsGateway.broadcastMoviesList('Final movie selected');
                    } else {
                        await this.roomsGateway.broadcastMoviesList('Movies data updated');
                    }
                } else {
                    await this.roomsGateway.broadcastMoviesList('No common movies found');
                }
            }
        }
    }

    private async getCommonMovieIds(roomKey: string): Promise<string[]> {
        const matches = await this.matchRepository.find({ where: { roomKey } });

        const movieIdCounts: Record<string, number> = {};

        for (const match of matches) {
            const movieIds = Array.isArray(match.movieId) ? match.movieId : [match.movieId];

            for (const movieId of movieIds) {
                if (movieIdCounts[movieId]) {
                    movieIdCounts[movieId]++;
                } else {
                    movieIdCounts[movieId] = 1;
                }
            }
        }

        const commonMovieIds = Object.keys(movieIdCounts).filter(
            (movieId) => movieIdCounts[movieId] === matches.length,
        );

        return commonMovieIds;
    }

    async fetchMoviesFromIds(baseURL: string, ids: string[]): Promise<any> {
        const url = `${baseURL}page=1&limit=10&${ids.map((id) => `id=${id}`).join('&')}`;
        console.log('url with id: ', url);
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

    async getCurrentMatchData(roomKey: string): Promise<Match[]> {
        const matches = await this.matchRepository.find({ where: { roomKey } });

        if (matches.length === 0) {
            throw new NotFoundException('Match not found');
        }
        console.log('Current match data: ', matches);
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
