import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { SocketBodyInterface } from "@src/match/match.interfaces";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "@src/match/match.model";
import { Repository } from "typeorm";
import { GetUser } from "@src/user/user.interfaces";

@Injectable()
export class MatchService {
    constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

    async feedbackMovie() {}
}