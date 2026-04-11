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
    handleLogMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        console.log('Received data:', data);

        const message = data?.message ?? 'No message provided';
        console.log(`Received message: ${message}`);

        if (data?.roomKey && typeof data.roomKey === 'string') {
            this.server.to(data.roomKey).emit('broadcastMovies', data);
        } else {
            client.emit('broadcastMovies', data);
        }
    }

    @SubscribeMessage('requestMatchData')
    async handleRequestMatchData(@MessageBody() data: { roomKey?: string }, @ConnectedSocket() client: Socket) {
        const roomKey = data?.roomKey;
        if (!roomKey) {
            return;
        }
        await client.join(roomKey);
        const matches = await this.roomsService.getMatchesInRoom(roomKey);
        console.log('requestMatchData: ', { matches });
        this.server.to(roomKey).emit('matchUpdated', matches);
    }

    @SubscribeMessage('startMatch')
    async handleStartMatch(@MessageBody() data: { roomKey: string }, @ConnectedSocket() client: Socket) {
        const roomKey = data?.roomKey;
        if (!roomKey) {
            client.emit('startMatchResponse', { status: 'error', message: 'roomKey is required' });
            return;
        }
        await client.join(roomKey);
        try {
            const result = await this.roomsService.startMatch(roomKey);
            this.server.to(roomKey).emit('startMatchResponse', result);
        } catch (error: any) {
            this.server.to(roomKey).emit('startMatchResponse', { status: 'error', message: error.message });
        }
    }

    @SubscribeMessage('startBroadcastingMovies')
    async handleBroadcastingMovies(@MessageBody() roomKey: string, @ConnectedSocket() client: Socket) {
        if (typeof roomKey !== 'string' || !roomKey) {
            return;
        }
        await client.join(roomKey);
        const message = {
            type: 'broadcastMovies',
            messageForClient: 'Movies data updated',
        };
        this.server.to(roomKey).emit('broadcastMovies', message);
    }

    /** Join socket.io room so this client receives room-scoped events (must match HTTP room key). */
    @SubscribeMessage('joinRoom')
    async handleJoinRoomSocket(
        @MessageBody() data: { roomKey?: string; roomId?: string; userId?: string | number },
        @ConnectedSocket() client: Socket,
    ) {
        const roomKey = data?.roomKey ?? data?.roomId;
        if (!roomKey || typeof roomKey !== 'string') {
            client.emit('error', { message: 'roomKey is required' });
            return;
        }
        await client.join(roomKey);
    }

    broadcastMoviesList(messageForClient: string, roomKey: string) {
        if (!roomKey) {
            console.warn('broadcastMoviesList: missing roomKey, skip broadcast');
            return;
        }
        const message = {
            type: 'broadcastMovies',
            messageForClient,
        };
        console.log('broadcast movie list', message);

        this.server.to(roomKey).emit('broadcastMovies', message);
    }

    broadcastMatchDataUpdate(messageForClient: string, roomKey: string) {
        if (!roomKey) {
            console.warn('broadcastMatchDataUpdate: missing roomKey, skip broadcast');
            return;
        }
        const message = {
            type: 'broadcastMatchDataUpdated',
            messageForClient,
        };
        this.server.to(roomKey).emit('broadcastMatchDataUpdated', message);
    }

    notifyRoomJoined(room: Match) {
        const roomKey = room.roomKey;
        if (!roomKey) {
            return;
        }
        this.server.to(roomKey).emit('matchUpdated', {
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
            const users = await this.roomsService.getMatchesInRoom(roomKey);

            client.leave(roomKey);
            this.server.to(roomKey).emit('roomUpdate', {
                message: `${userId} has left the room`,
                users,
            });
        } catch (error) {
            client.emit('error', this.formatError(error));
        }
    }

    async emitFiltersUpdated(roomKey: string, filters: any) {
        if (!roomKey) {
            return;
        }
        await this.server.to(roomKey).emit('filtersUpdated', { roomKey, filters });
        console.log(`Broadcasting filters update to room ${roomKey}:`, filters);
    }
}
