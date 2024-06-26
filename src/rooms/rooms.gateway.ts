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
    ) {}

    @SubscribeMessage('logMessage')
    handleLogMessage(@MessageBody() data: any) {
        console.log('Received data:', data);

        const message = data?.message ?? 'No message provided';
        console.log(`Received message: ${message}`);

        this.server.emit('broadcastMessage', data);
    }

    @SubscribeMessage('requestMatchData')
    async handleRequestMatchData(@MessageBody() data) {
        const matches = await this.roomsService.getMatchesInRoom(data.roomKey);
        console.log('requestMatchData: ', { matches });
        this.server.emit('matchUpdated', matches);
    }

    @SubscribeMessage('startMatch')
    async handleStartMatch(@MessageBody() data: { roomKey: string }) {
        try {
            const result = await this.roomsService.startMatch(data.roomKey);
            this.server.emit('startMatchResponse', result);
        } catch (error: any) {
            this.server.emit('startMatchResponse', { status: 'error', message: error.message });
        }
    }

    @SubscribeMessage('vote')
    async handleVote(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { key: string; userId: number; userName: string; movieId: string; vote: boolean },
    ) {
        console.log('vote: ', client, payload);

        if (!payload.key || !payload.userId || !payload.movieId || typeof payload.vote !== 'boolean') {
            client.emit('voteError', { status: 'error', message: 'Invalid payload' });
            return;
        }

        try {
            await this.roomsService.vote(payload.key, payload.userId, payload.userName, payload.movieId, payload.vote);
            client.emit('voteSuccess', { status: 'success', message: 'Vote registered successfully' });
        } catch (error: any) {
            console.error('Error handling vote:', error);
            client.emit('voteError', { status: 'error', message: error.message });
        }
    }

    @SubscribeMessage('voteEnded')
    async handleVoteEnd(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomKey: string; movieId: string },
    ) {
        try {
            await this.roomsService.handleVoteEnd(payload.roomKey, payload.movieId);
        } catch (error: any) {
            client.emit('voteEndError', { status: 'error', message: error.message });
        }
    }

    async broadcastMoviesList(messageForClient: string) {
        const message = {
            type: 'broadcastMovies',
            messageForClient,
        };
        console.log('broadcast movie list', message);

        await this.server.emit('broadcastMovies', message);
    }

    async handleJoinMatch(@MessageBody() data: { userId: number; roomId: string }, @ConnectedSocket() client: Socket) {
        const match = await this.roomsService.joinRoom(data.userId, data.roomId);
        client.join(data.roomId);
        this.server.to(data.roomId).emit('userJoined', match);
    }

    notifyRoomJoined(room: Match) {
        console.log(`Notifying room join: ${room.userName}`);
        this.server.to(room.roomId).emit('matchUpdated', {
            message: `${room.userName} has joined the room`,
            roomDetails: { id: room.roomId, name: room.userName },
            newUser: { ...room },
        });
    }

    afterInit(server: Server) {
        console.log(server);
    }

    handleDisconnect(client: Socket) {
        console.log(`Disconnected: ${client.id}`);
    }

    handleConnection(client: Socket) {
        console.log(`Connected ${client.id}`);
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
