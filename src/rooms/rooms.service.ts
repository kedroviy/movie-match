import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '@src/rooms/rooms.model';
import { RoomKeyType } from '@src/rooms/rooms.interfeces';
import { Match } from '@src/match/match.model';
import { UserService } from '@src/user/user.service';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room) private roomRepository: Repository<Room>,
        @InjectRepository(Match) private matchRepository: Repository<Match>,
        private readonly userService: UserService,
    ) {}

    async createRoom(userId: string): Promise<RoomKeyType> {
        const room = await this.getUsersRooms(userId);

        if (room) {
            throw new ConflictException('Room already exists for this user');
        }

        const key = this.generateKey();

        const newRoom = this.roomRepository.create({
            authorId: userId,
            key,
        });

        const userName = await this.userService.getUserById(userId);

        try {
            await this.roomRepository.save(newRoom);

            const roomUser = this.matchRepository.create({
                userId: userId,
                roomId: newRoom.id,
                userName: userName.username,
            });

            await this.matchRepository.save(roomUser);

            return { key: newRoom.key };
        } catch (error) {
            throw new BadRequestException('Failed to create room: ' + error);
        }
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
        });

        await this.matchRepository.save(roomUser);

        return this.getRoomDetails(room.id.toString());
    }

    async leaveFromRoom(roomKey: string, userId: string): Promise<any> {
        const room = await this.roomRepository.findOne({ where: { key: roomKey } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const match = await this.matchRepository.findOne({
            where: { userId: userId, roomId: room.id },
        });

        if (!match) {
            throw new BadRequestException('User is not in this room');
        }

        await this.matchRepository.remove(match);

        return { message: 'Left the room successfully' };
    }

    async deleteRoom(roomId: number): Promise<void> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });

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

        // Преобразуйте данные комнаты в DTO, если необходимо
        return room;
    }

    async getRoomByKey(key: string): Promise<Room> {
        return this.roomRepository.findOne({
            where: { key },
        });
    }

    private async getUsersRooms(userId: string): Promise<Room> {
        return this.roomRepository.findOne({
            where: { authorId: userId },
        });
    }

    private generateKey(): string {
        return String(Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000);
    }
}
