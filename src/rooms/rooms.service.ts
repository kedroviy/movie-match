import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, Repository } from "typeorm";
import { Room } from "@src/rooms/rooms.model";

@Injectable()
export class RoomsService {

    constructor(@InjectRepository(Room) private roomRepository: Repository<Room>) {}

    async createRoom(userId: string): Promise<string> {

        const room = await this.getUsersRooms(userId);

        if (room) {
            throw new NotFoundException('Room already exists for this user');
        }

        const key = this.generateKey();

        const newRoom = this.roomRepository.create({
            authorId: userId,
            key
        })

        try {
            await this.roomRepository.save(newRoom);
            return newRoom.key;
        } catch (error) {
            throw new NotFoundException('Failed to create room: ' + error.message);
        }
    }

    async deleteRoom(roomId: number): Promise<void> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId }
        });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        await this.roomRepository.remove(room);
    }

    private async getUsersRooms(userId: string): Promise<Room> {
        return this.roomRepository.findOne({
            where: { authorId: userId }
        })
    }

    private generateKey(): string {
        return String(Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000);
    }
}