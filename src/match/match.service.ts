import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "@src/match/match.model";
import { GetUser } from "@src/user/user.interfaces";
import { Equal, Repository } from "typeorm";
import { SocketBodyInterface } from "./match.interfaces";
import { Room } from "@src/rooms/rooms.model";

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly jwtService: JwtService
    ) { }

    feedbackMovie(body: SocketBodyInterface, userId: string, room: Room): void {
        const { movieId } = body
        this.matchRepository.save({ movieId, room, userId });
    }

    async checkByMatch(room: Room) {
        const roomsFeedback = await this.matchRepository.find({ where: { room: Equal(room.id) } });

        const uniqueUserIds = [...new Set(roomsFeedback.map(match => match.userId))];

        if (uniqueUserIds.length < 2) {
            return null; 
        }

        const movieCounts: { [movieId: string]: number } = {};

        for (const userId of uniqueUserIds) {
            const userMovies = new Set(roomsFeedback.filter(match => match.userId === userId).map(match => match.movieId));

            for (const movieId of userMovies) {
                if (!movieCounts[movieId]) {
                    movieCounts[movieId] = 1;
                } else {
                    movieCounts[movieId]++;
                }
            }
        }

        const likedMovie = Object.keys(movieCounts).find(movieId => movieCounts[movieId] === uniqueUserIds.length);

        return likedMovie || null; 
    }
    
    async verifyToken(token: string): Promise<GetUser | false> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET
            });
            return payload;
        } catch (error) {
            return false;
        }
    }
}