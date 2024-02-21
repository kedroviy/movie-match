import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Room } from "@src/rooms/rooms.model";

@Injectable()
export class RoomsService {

    constructor(@InjectRepository(Room) private roomRepository: Repository<Room>) {}

    async createRoom(userId: string) {
        return null
    }
}
