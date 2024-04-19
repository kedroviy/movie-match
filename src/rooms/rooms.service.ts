import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from '@src/rooms/rooms.model';
import { RoomKeyType } from '@src/rooms/rooms.interfeces';
import { Match } from '@src/match/match.model';
import { UserService } from '@src/user/user.service';
import { RoomsGateway } from './rooms.gateway';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly userService: UserService,
        @Inject(forwardRef(() => RoomsGateway))
        private readonly roomsGateway: RoomsGateway,
    ) { }

    async createRoom(userId: string, name?: string, filters?: any): Promise<RoomKeyType> {
        const existingRoom = await this.getUsersRooms(userId);
        if (existingRoom) {
            throw new ConflictException('Room already exists for this user');
        }

        const key = this.generateKey();

        const newRoom = this.roomRepository.create({
            authorId: userId,
            key,
            name,
            status: RoomStatus.WAITING,
            filters,
        });

        await this.roomRepository.save(newRoom);

        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const roomUser: Match = this.matchRepository.create({
            userId: userId,
            roomId: newRoom.id,
            userName: user.username,
            roomKey: newRoom.key,
            role: 'admin',
        });

        await this.matchRepository.save(roomUser);
        this.roomsGateway.notifyRoomJoined(roomUser);
        return {
            ...newRoom,
            ...roomUser,
        };
    }

    async joinRoom(key: string, userId: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key }, relations: ['users'] });
        const existingUser = await this.matchRepository.findOne({
            where: { userId, roomId: room.id },
        });

        const userName = await this.userService.getUserById(userId);

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (existingUser) {
            throw new BadRequestException('User already joined this room');
        }

        const roomUser = this.matchRepository.create({
            userId: userId,
            roomId: room.id,
            userName: userName.username,
            roomKey: room.key,
            role: 'participant',
        });

        await this.matchRepository.save(roomUser);

        this.roomsGateway.broadcastMatchUpdate({
            type: 'matchUpdated',
            ...roomUser,
        });
        this.roomsGateway.notifyRoomJoined(roomUser);

        return roomUser;
    }

    async leaveFromRoom(key: string, userId: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key }, relations: ['users'] });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        room.users = room.users.filter((user: any) => user.id !== userId);
        await this.roomRepository.save(room);

        return { message: 'Left the room successfully' };
    }

    async deleteRoom(key: string): Promise<void> {
        const room = await this.roomRepository.findOne({ where: { key } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        await this.roomRepository.remove(room);
    }

    async updateRoomFilters(key: string, filters: any): Promise<void> {
        const room = await this.roomRepository.findOne({ where: { key } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        room.filters = filters;
        await this.roomRepository.save(room);
    }

    async getRoomDetails(roomId: string): Promise<any> {
        const room = await this.roomRepository.findOne({
            where: { key: roomId },
            relations: ['users'],
        });

        if (!room) {
            throw new NotFoundException('Комната не найдена');
        }

        return room;
    }

    async getUsersInRoom(roomKey: string): Promise<any[]> {
        const matches = await this.matchRepository.find({
            where: { roomKey: roomKey },
            relations: ['user'],
        });
        return matches.map((match: any) => match.userName);
    }

    async getRoomByKey(key: string): Promise<Room> {
        return this.roomRepository.findOne({ where: { key }, relations: ['users', 'matches'] });
    }

    private generateKey(): string {
        return String(Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000);
    }

    private async getUsersRooms(userId: string): Promise<Room> {
        return this.roomRepository.findOne({
            where: { authorId: userId },
        });
    }

    async addMatchToRoom(roomId: string, userId: string, userName: string) {
        const room = await this.roomRepository.findOne({ where: { id: roomId } });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const match = this.matchRepository.create({
            userId,
            roomId,
            userName,
        });

        await this.matchRepository.save(match);

        this.roomsGateway.updateMatchDetails({
            type: 'newMatch',
            roomId: roomId,
            matchId: match.id.toString(),
            userName: userName,
        });
    }
}
