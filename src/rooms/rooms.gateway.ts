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

import { Inject, forwardRef } from '@nestjs/common';
import { Match } from '@src/match/match.model';

@WebSocketGateway({
    namespace: 'rooms',
    transports: ['websocket'],
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
        // private readonly userService: UserService,
    ) {}

    @SubscribeMessage('logMessage')
    handleLogMessage(@MessageBody() data: any) {
        // Log the entire payload to debug the structure
        console.log('Received data:', data);

        // Safely extract the message with a default value
        const message = data?.message ?? 'No message provided';
        console.log(`Received message: ${message}`);

        // Broadcast the message to all connected clients
        this.server.emit('broadcastMessage', data);
    }

    // async handleJoinRoom(
    //     @ConnectedSocket() client: Socket,
    //     @MessageBody() { key, userId }: { key: string; userId: string },
    // ) {
    //     try {
    //         const roomDetails = await this.roomsService.joinRoom(key, userId);
    //         const users = await this.roomsService.getMatchesInRoom(key);

    //         client.join(key);

    //         await this.server.to(key).emit('matchUpdated', {
    //             message: `${userId} has joined the room`,
    //             roomDetails: roomDetails,
    //             users,
    //         });
    //         console.log('handleJoinRoom work');

    //         await client.emit('roomUpdate', {
    //             message: `You have joined the room: ${roomDetails.name}`,
    //             roomDetails: roomDetails,
    //         });
    //     } catch (error) {
    //         client.emit('error', this.formatError(error));
    //     }
    // }

    @SubscribeMessage('requestMatchData')
    async handleRequestMatchData(@MessageBody() data) {
        const matches = await this.roomsService.getMatchesInRoom(data.roomKey);
        console.log('requestMatchData: ', { matches });
        this.server.emit('matchUpdated', matches);
    }

    // async broadcastMatchUpdate(data) {
    //     console.log(`Sending matchUpdate to room ${data.roomKey}:`, data);
    //     const matches = await this.roomsService.getMatchesInRoom(data.roomKey);
    //     this.server.to(data.roomKey).emit('matchUpdate', matches);
    // }

    async handleJoinMatch(@MessageBody() data: { userId: string; roomId: string }, @ConnectedSocket() client: Socket) {
        const match = await this.roomsService.joinRoom(data.userId, data.roomId);
        client.join(data.roomId.toString());
        this.server.to(data.roomId.toString()).emit('userJoined', match);
    }

    notifyRoomJoined(room: Match) {
        console.log(`Notifying room join: ${room.userName}`);
        this.server.to(room.roomId).emit('matchUpdated', {
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
            const users = await this.roomsService.getMatchesInRoom(roomKey); // Fetch all users

            client.leave(roomKey);
            this.server.to(roomKey).emit('roomUpdate', {
                message: `${userId} has left the room`,
                users,
            });
        } catch (error) {
            client.emit('error', this.formatError(error));
        }
    }

    @SubscribeMessage('filtersUpdated')
    async broadcastFilters(roomKey: string, filters: any) {
        await this.server.to(roomKey).emit('filtersUpdated', { roomKey, filters });
        console.log(`Broadcasting filters update to room ${roomKey}:`, filters);
    }
}
