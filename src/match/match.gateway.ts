import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { MatchService } from './match.service';
import { SocketBodyInterface } from "@src/match/match.interfaces";
import { Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { SocketJwtGuard } from "@src/match/guards/socket-jwt-guard";
import { UserWS } from "y/common/decorators/getData/getUserDecoratorWS";
import { GetUser } from "@src/user/user.interfaces";

@WebSocketGateway()
@UseGuards(SocketJwtGuard)
export class MatchGateway {
    @WebSocketServer() server: Socket;
    constructor(private readonly matchService: MatchService) { }

    @SubscribeMessage('feedback')
    feedbackMovie(@MessageBody() body: SocketBodyInterface, @UserWS() user: GetUser) {
        return this.matchService.feedbackMovie(body, user, this.server)
    }
}