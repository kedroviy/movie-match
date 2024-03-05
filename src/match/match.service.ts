import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "@src/match/match.model";
import { Repository } from "typeorm";

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly jwtService: JwtService,
    ) { }

    async feedbackMovie() { }
    
    async verifyToken(token: string): Promise<boolean> {
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