import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { MatchService } from './match.service';
import { SocketBodyInterface } from "@src/match/match.interfaces";
import { Socket, Server } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { SocketJwtGuard } from "@src/match/guards/socket-jwt-guard";
import { UserWS } from "y/common/decorators/getData/getUserDecoratorWS";
import { GetUser } from "@src/user/user.interfaces";

@WebSocketGateway()
export class MatchGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly matchService: MatchService) { }

    afterInit(server: Server) {
        console.log('WebSocket gateway initialized');
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('feedback')
    @UseGuards(SocketJwtGuard)
    feedbackMovie(@MessageBody() body: SocketBodyInterface, @UserWS() user: GetUser, client: Socket) {
        const { room, movieId } = body;

        if (user && user.id) {
            this.server.socketsJoin(`room${room}`);

            console.log(this.server.in(room))

            this.server.to(`room${room}`).emit(`room${room}`, "Authorized user message");
        } else {
            console.log('Unauthorized user');
            client.emit('error', 'Unauthorized');
        }
    }

}
