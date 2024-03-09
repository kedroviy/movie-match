import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { MatchService } from './match.service';
import { Socket, Server } from "socket.io";
import { UserWS } from "y/common/decorators/getData/getUserDecoratorWS";
import { GetUser } from "@src/user/user.interfaces";
import { SocketBodyInterface } from "./match.interfaces";
import { RoomsService } from "@src/rooms/rooms.service";

@WebSocketGateway()
export class MatchGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private readonly matchService: MatchService,
        private readonly roomsService: RoomsService
    ) {}

    afterInit(server: Server) {
        console.log('WebSocket gateway initialized');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        const token = client.handshake.headers.authorization;
        const userVerify = await this.matchService.verifyToken(token);
        if (!token || !userVerify) {
            client.disconnect(true); 
        }
        client.handshake.auth.user = userVerify;
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('feedback')
    async feedbackMovie(@MessageBody() body: SocketBodyInterface, @UserWS() user: GetUser, @ConnectedSocket() client: Socket) {
        const roomKey = client.handshake.headers.room;
        const room = await this.roomsService.getRoomByKey(roomKey as string);

        if (room) {
            await this.matchService.feedbackMovie(body, user.id, room);

            const checkByMatch = await this.matchService.checkByMatch(room);

            if (checkByMatch) {
                this.server.emit(`room${roomKey}`, checkByMatch);
            }
        }
    }
}