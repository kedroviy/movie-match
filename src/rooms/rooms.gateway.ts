import {
    WebSocketGateway,
    SubscribeMessage,
    WebSocketServer,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { UserService } from '@src/user/user.service';
import { Inject, forwardRef } from '@nestjs/common';
import { Match } from '@src/match/match.model';

@WebSocketGateway({
    namespace: 'rooms',
    cors: {
        origin: '*',
    },
})
export class RoomsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    onModuleInit() {
        this.server.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    }

    constructor(
        @Inject(forwardRef(() => RoomsService))
        private roomsService: RoomsService,
        private readonly userService: UserService,
    ) { }

    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() { key, userId }: { key: string; userId: string },
    ) {
        try {
            const roomDetails = await this.roomsService.joinRoom(key, userId);
            const user = await this.userService.getUserById(roomDetails.userId);
            const users = await this.roomsService.getUsersInRoom(key);
            const matchDetails = await this.roomsService.getUsersInRoom(key);

            this.server.to(key).emit('roomUpdate', {
                roomDetails: roomDetails,
                matchDetails: matchDetails,
            });

            client.join(key);
            this.server.to(key).emit('roomUpdate', {
                message: `${user.username} has joined the room`,
                roomDetails: roomDetails,
                newUser: {
                    id: user.id,
                    username: user.username,
                },
                users,
            });

            client.emit('roomUpdate', {
                message: `You have joined the room: ${roomDetails.name}`,
                roomDetails: roomDetails,
            });
            console.log(`Data sent to room ${key}:`, matchDetails);
        } catch (error) {
            client.emit('error', this.formatError(error));
        }
    }

    broadcastMatchUpdate(data): void {
        this.server.emit('matchUpdate', data);
    }

    updateMatchDetails(data: { type: string; roomId: string; matchId: string; userName: string }) {
        this.server.to(data.roomId).emit('matchUpdate', data);
    }

    async handleJoinMatch(@MessageBody() data: { userId: string; roomId: string }, @ConnectedSocket() client: Socket) {
        const match = await this.roomsService.joinRoom(data.userId, data.roomId);
        client.join(data.roomId.toString());
        this.server.to(data.roomId.toString()).emit('userJoined', match);
    }

    notifyRoomJoined(room: Match) {
        console.log(`Notifying room join: ${room.userName}`);
        this.server.to(room.roomId).emit('roomUpdate', {
            message: `${room.userName} has joined the room`,
            roomDetails: { id: room.roomId, name: room.userName },
            newUser: { ...room },
        });
    }

    // @SubscribeMessage('likeMovie')
    // async handleLikeMovie(
    //     @MessageBody() data: { userId: string; roomId: number; movieId: string },
    //     @ConnectedSocket() client: Socket,
    // ) {
    //     const match = await this.matchService.likeMovie(data.userId, data.roomId, data.movieId);
    //     this.server.to(data.roomId.toString()).emit('movieLiked', match);
    // }

    afterInit(server: Server) {
        console.log(server);
        //Do stuffs
    }

    handleDisconnect(client: Socket) {
        console.log(`Disconnected: ${client.id}`);

        //Do stuffs
    }

    handleConnection(client: Socket) {
        console.log(`Connected ${client.id}`);
        //Do stuffs
    }
    private formatError(error: any): { message: string } {
        if (typeof error === 'object' && error !== null && 'message' in error) {
            return { message: error.message };
        } else {
            return { message: 'An unknown error occurred' };
        }
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() { roomKey, userId }: { roomKey: string; userId: string },
    ) {
        try {
            await this.roomsService.leaveFromRoom(roomKey, userId);
            const users = await this.roomsService.getUsersInRoom(roomKey); // Fetch all users

            client.leave(roomKey);
            this.server.to(roomKey).emit('roomUpdate', {
                message: `${userId} has left the room`,
                users,
            });
        } catch (error) {
            client.emit('error', this.formatError(error));
        }
    }
}
