import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { MatchService } from './match.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class MatchGateway {
    constructor(private readonly matchService: MatchService) { }

    @WebSocketServer() server: Socket;

    @SubscribeMessage('events1')
    handleEvent(@MessageBody() body: any) {
        this.server.emit(`events${1}`, body);
    }
}
