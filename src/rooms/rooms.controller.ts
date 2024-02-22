import { Controller, Delete, Post } from "@nestjs/common";
import { RoomsService } from './rooms.service';
import { User } from "y/common/decorators/getData/getUserDecorator";
import { GetUser } from "@src/user/interfaces";

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Post("create")
    createRoom(@User() user: GetUser) {
        const { id } = user
        try {
            return this.roomsService.createRoom(id);
        } catch (error) {
            throw error;
        }
    }
}