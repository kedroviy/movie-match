import {
    // BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    // UnauthorizedException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from '@src/rooms/rooms.model';
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
    ) {}

    async createRoom(userId: string, name?: string, filters?: any): Promise<Match> {
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
            ...roomUser,
        };
    }

    async joinRoom(key: string, userId: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key }, relations: ['users'] });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const existingUser = await this.matchRepository.findOne({
            where: { userId, roomId: room.id },
        });

        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        let roomUser;

        if (existingUser) {
            roomUser = existingUser;
        } else {
            roomUser = this.matchRepository.create({
                userId: userId,
                roomId: room.id,
                userName: user.username,
                roomKey: room.key,
                role: 'participant',
            });
            await this.matchRepository.save(roomUser);
            this.roomsGateway.notifyRoomJoined(roomUser);
        }

        await this.matchRepository.save(roomUser);

        const matchesInRoom = await this.getMatchesInRoom(key);
        this.roomsGateway.handleRequestMatchData({
            type: 'matchUpdated',
            roomKey: key,
            matches: matchesInRoom,
        });

        return matchesInRoom;
    }

    async updateRoomFilters(userId: string, roomId: string, filters: any): Promise<any> {
        console.log('userId: ', userId, 'roomId: ', roomId, 'filters: ', filters);
        const room = await this.roomRepository.findOneBy({ id: roomId });

        console.log('room: ', userId);
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const matches = await this.matchRepository.find({
            where: { roomId: roomId },
        });

        if (matches.length === 0) {
            throw new NotFoundException('No matches found in room');
        }

        const roomKey = matches[0]?.roomKey;
        // if (room.authorId !== userId) {
        //     throw new UnauthorizedException('You do not have permission to modify this room');
        // }
        room.filters = filters;
        console.log(filters);
        await this.roomRepository.save(room);

        await this.roomsGateway.broadcastFilters(roomKey, filters);

        return { message: 'Filters successfully updated.' };
    }

    async doesUserHaveRoom(
        userId: string,
    ): Promise<{ message: string; match?: Match[] } | { message: string; key?: string }> {
        const room = await this.roomRepository.findOne({ where: { authorId: userId } });

        if (room) {
            const matches = await this.matchRepository.find({ where: { roomKey: room.key } });
            return { message: 'room exist', match: matches, key: room.key };
        } else {
            return { message: 'room not found' };
        }
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

    async leaveFromMatch(userId: string, roomKey: string): Promise<any> {
        const match = await this.matchRepository.findOne({
            where: { userId: userId, roomKey: roomKey },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        await this.matchRepository.remove(match);
        return { message: 'Successfully left the match' };
    }

    async deleteRoom(key: string): Promise<void> {
        const room = await this.roomRepository.findOne({ where: { key } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        await this.roomRepository.remove(room);
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

    async getMatchesInRoom(roomKey: string): Promise<Match[]> {
        const matches = await this.matchRepository.find({
            where: { roomKey: roomKey },
        });

        return matches;
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

    // async addMatchToRoom(roomId: string, userId: string, userName: string) {
    //     const room = await this.roomRepository.findOne({ where: { id: roomId } });

    //     if (!room) {
    //         throw new NotFoundException('Room not found');
    //     }

    //     const match = this.matchRepository.create({
    //         userId,
    //         roomId,
    //         userName,
    //     });

    //     await this.matchRepository.save(match);

    //     this.roomsGateway.updateMatchDetails({
    //         type: 'newMatch',
    //         roomId: roomId,
    //         matchId: match.id.toString(),
    //         userName: userName,
    //     });
    // }
}
