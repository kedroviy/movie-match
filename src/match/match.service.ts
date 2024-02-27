import { BadRequestException, Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { SocketBodyInterface } from "@src/match/match.interfaces";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "@src/match/match.model";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private jwtService: JwtService
    ) {}

    async feedbackMovie(body: SocketBodyInterface, server: Socket) {
        const { token, room, movieId } = body;

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET
            });

            if (!payload) {
                throw new BadRequestException('Invalid token');
            }

            return server.emit(`room${room}`, body);
        } catch (error) {
            return server.emit(`room${room}`, "Fuck off");
        }
    }
}