import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '@src/rooms/rooms.model';
import { RoomKeyType } from '@src/rooms/rooms.interfeces';

@Injectable()
export class RoomsService {
    constructor(@InjectRepository(Room) private roomRepository: Repository<Room>) {}

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

        try {
            await this.roomRepository.save(newRoom);
            return { key: newRoom.key };
        } catch (error) {
            throw new BadRequestException('Failed to create room: ' + error);
        }
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
