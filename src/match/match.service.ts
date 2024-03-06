import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "@src/match/match.model";
import { RoomsService } from "@src/rooms/rooms.service";
import { GetUser } from "@src/user/user.interfaces";
import { Repository } from "typeorm";
import { SocketBodyInterface } from "./match.interfaces";
import { Room } from "@src/rooms/rooms.model";

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly jwtService: JwtService,
        private readonly roomsService: RoomsService
    ) { }

    async feedbackMovie(body: SocketBodyInterface, userId: string, room: Room) {
        this.matchRepository.create({
            movieId: body.movieId,
            room,
            userId,
        });
    }

    async checkByMatch() {}
    
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