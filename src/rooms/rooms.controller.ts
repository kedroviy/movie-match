import { Controller, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { User } from 'y/common/decorators/getData/getUserDecorator';
import { GetUser } from '@src/user/user.interfaces';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiTags,
} from '@nestjs/swagger';
import { RoomKeyResponse } from '@src/rooms/rooms.response.types';

@Controller('rooms')
@ApiTags('Rooms')
@ApiBearerAuth()
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Post('create')
    @ApiCreatedResponse({ type: RoomKeyResponse })
    @ApiConflictResponse({ description: 'Room already exists for this user' })
    @ApiBadRequestResponse({ description: 'Failed to create room' })
    createRoom(@User() user: GetUser) {
        const { id } = user;
        return this.roomsService.createRoom(id);
    }
}
