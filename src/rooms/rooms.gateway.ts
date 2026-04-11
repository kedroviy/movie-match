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

        this.server.emit('broadcastMovies', data);
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

    @SubscribeMessage('startBroadcastingMovies')
    async handleBroadcastingMovies(@MessageBody() message: string) {
        const roomKey = typeof message === 'string' ? message : (message as any)?.roomKey;
        if (!roomKey) {
            console.warn('startBroadcastingMovies: missing roomKey');
            return;
        }
        const room = await this.roomsService.getRoomByKey(roomKey);
        this.broadcastMoviesList('Movies data updated', roomKey, {
            aggregateVersion: room?.aggregateVersion ?? 0,
            matchPhase: room?.matchPhase,
        });
    }

    broadcastMoviesList(
        messageForClient: string,
        roomKey: string,
        meta?: { aggregateVersion: number; matchPhase: string },
    ) {
        const message = {
            type: 'broadcastMovies',
            messageForClient,
            roomKey,
            aggregateVersion: meta?.aggregateVersion,
            matchPhase: meta?.matchPhase,
        };
        console.log('broadcast movie list', message);

        this.server.emit('broadcastMovies', message);
    }

    emitFiltersUpdated(roomKey: string, filters: any): void {
        this.server.to(roomKey).emit('filtersUpdated', { roomKey, filters });
    }

    broadcastMatchDataUpdate(messageForClient: string) {
        const message = {
            type: 'broadcastMatchDataUpdated',
            messageForClient,
        };
        this.server.emit('broadcastMatchDataUpdated', message);
    }

    notifyRoomJoined(room: Match) {
        this.server.emit('matchUpdated', {
            message: `${room.userName} has joined the room`,
            roomDetails: { id: room.roomId, name: room.userName },
            newUser: { ...room },
        });
    }

    async handleJoinMatch(@MessageBody() data: { userId: number; roomId: string }, @ConnectedSocket() client: Socket) {
        const match = await this.roomsService.joinRoom(data.userId, data.roomId);
        client.join(data.roomId);
        this.server.to(data.roomId).emit('userJoined', match);
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

}
