import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';

import { RoomsService } from '@src/rooms/rooms.service';

@WebSocketGateway({ transports: ['websocket'] })
export class MatchGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly roomsService: RoomsService) {}

    afterInit() {
        console.log('WebSocket gateway initialized');
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    sendRoomUpdate(roomId: string, data: any) {
        this.server.to(roomId).emit('roomUpdate', data);
    }

    joinRoom(client: Socket, roomId: string) {
        client.join(roomId);
        this.sendRoomUpdate(roomId, { roomId });
    }

    leaveRoom(client: Socket, roomId: string) {
        client.leave(roomId);
        this.sendRoomUpdate(roomId, { roomId });
    }

    @SubscribeMessage('roomconnect')
    async connectToRoom(client: Socket) {
        const roomKey = client.handshake.headers.room;
        const room = await this.roomsService.getRoomByKey(roomKey as string);

        if (room) {
            this.server.socketsJoin(`room${roomKey}`);
        }
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@MessageBody() data: { key: string; userId: number }, @ConnectedSocket() client: Socket) {
        try {
            const roomKey = data.key;
            const userId = data.userId;

            const roomDetails = await this.roomsService.joinRoom(userId, roomKey);

            client.join(`room${roomKey}`);

            client.emit('joinedRoom', { message: 'Вы успешно присоединились к комнате', roomDetails });

            this.sendRoomUpdate(`room${roomKey}`, roomDetails);
        } catch (error) {
            client.emit('error', { message: 'Ошибка при подключении к комнате' });
        }

        client.emit('roomInfo');
    }

    @SubscribeMessage('getRoomInfo')
    async handleGetRoomInfo(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        try {
            const room = await this.roomsService.getRoomDetails(data.roomId);
            client.emit('roomInfo', room);
        } catch (error) {
            client.emit('error', { message: 'Ошибка при получении информации о комнате' });
        }
    }

    @SubscribeMessage('feedback')
    async feedbackMovie(
        // @MessageBody() body: SocketBodyInterface,
        // @UserWS() user: GetUser,
        @ConnectedSocket() client: Socket,
    ) {
        // const { movieId } = body;
        const roomKey = client.handshake.headers.room;

        // this.matchService.feedbackMovie(body, user.id, room)

        this.server.to(`room${roomKey}`).emit(`room${roomKey}`, 'Authorized user message');
    }
}
