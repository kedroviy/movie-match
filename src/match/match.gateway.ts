import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { MatchService } from './match.service';
import { SocketBodyInterface } from "@src/match/match.interfaces";
import { Socket } from "socket.io";

@WebSocketGateway()
export class MatchGateway {
    @WebSocketServer() server: Socket;
    constructor(private readonly matchService: MatchService) { }

    @SubscribeMessage('feedback')
    feedbackMovie(@MessageBody() body: SocketBodyInterface) {
        return this.matchService.feedbackMovie(body, this.server)
    }
}
