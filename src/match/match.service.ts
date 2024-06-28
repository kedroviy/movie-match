import { Injectable, NotFoundException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from '@src/match/match.model';
// import { RoomsService } from '@src/rooms/rooms.service';
// import { GetUser } from '@src/user/user.interfaces';
import { Repository } from 'typeorm';
// import { SocketBodyInterface } from './match.interfaces';
// import { Room } from '@src/rooms/rooms.model';

@Injectable()
export class MatchService {
    constructor(
        // private readonly jwtService: JwtService,
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        // @InjectRepository(Room) private roomRepository: Repository<Room>,
    ) { }

    async likeMovie(userId: string, roomId: string, movieId: string): Promise<Match> {
        const match = await this.matchRepository.findOne({ where: { userId, roomId } });
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        match.movieId = movieId;
        match.vote = true;
        await this.matchRepository.save(match);

        const allMatches = await this.matchRepository.find({ where: { roomId } });
        const allLikedSameMovie = allMatches.every((m) => m.vote === true && m.movieId === movieId);

        if (allLikedSameMovie) {
        }

        return match;
    }
    // async verifyToken(token: string): Promise<GetUser | false> {
    //     try {
    //         const payload = await this.jwtService.verifyAsync(token, {
    //             secret: process.env.JWT_SECRET,
    //         });
    //         return payload;
    //     } catch (error) {
    //         return false;
    //     }
    // }
}
