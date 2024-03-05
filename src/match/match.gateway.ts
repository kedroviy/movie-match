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

    async handleConnection(client: Socket, ...args: any[]) {
        const token = client.handshake.headers.authorization;
        const auth = await this.matchService.verifyToken(token)
        if (!token || !auth) {
            client.disconnect(true); 
        }
        client.handshake.auth.user = auth;
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('feedback')
    feedbackMovie(@MessageBody() body: any, @UserWS() user: GetUser) {
        const { room, movieId } = body;

        console.log(user)
    
        this.server.socketsJoin(`room${room}`);
        this.server.to(`room${room}`).emit(`room${room}`, "Authorized user message");
    }
}