import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from '@src/match/match.model';
import { Repository } from 'typeorm';
import { LikeMovieDto } from './dto/like-movie.dto';
import { RoomsService } from '@src/rooms/rooms.service';
import { Room } from '@src/rooms/rooms.model';

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @Inject(RoomsService) private roomsService: RoomsService,
    ) {}

    async likeMovie(likeMovieDto: LikeMovieDto): Promise<string> {
        const { roomKey, userId, movieId } = likeMovieDto;

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

        await this.checkAndLoadNewMoviesIfNeeded(roomKey);

        return 'Movie liked successfully';
    }

    async checkAndLoadNewMoviesIfNeeded(roomKey: string): Promise<void> {
        const matches = await this.matchRepository.find({ where: { roomKey } });

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

        for (const match of matches) {
            const totalLikes = match.movieId.length;

            if (totalLikes >= 4) {
                await this.roomsService.fetchAndSaveMovies(room, filters);
                return;
            }
        }
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
}
