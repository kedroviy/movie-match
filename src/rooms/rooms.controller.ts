import {
    Body,
    ConflictException,
    Controller,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Put,
    Req,
    Get,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { User } from 'y/common/decorators/getData/getUserDecorator';
import { GetUser } from '@src/user/user.interfaces';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { RoomKeyResponse } from '@src/rooms/rooms.response.types';
import { AuthGuard } from '@src/auth/guards/public-guard';
import { Match } from '@src/match/match.model';

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

    @Post('join/:key')
    @ApiOperation({ summary: 'Join an existing room' })
    @ApiCreatedResponse({ description: 'Successfully joined the room' })
    @ApiBadRequestResponse({ description: 'User already joined this room' })
    @ApiNotFoundResponse({ description: 'Room not found' })
    async joinRoom(@Param('key') key: string, @Body('userId') userId: string) {
        return this.roomsService.joinRoom(key, userId);
    }

    @Get('user/:userId/hasRoom')
    async doesUserHaveRoom(
        @Param('userId') userId: string,
    ): Promise<{ message: string; match?: Match[] } | { message: string; key?: string }> {
        return this.roomsService.doesUserHaveRoom(userId);
    }

    @Post('leave/:key')
    async leaveRoom(@Param('key') key: string, @Body('userId') userId: string) {
        return this.roomsService.leaveFromRoom(key, userId);
    }

    @Post('leave-from-match')
    @UseGuards(AuthGuard)
    async leaveMatch(@Req() req, @Body() body: { userId: string; roomKey: string }) {
        try {
            const { userId, roomKey } = body;
            if (req.user.id !== userId) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            return await this.roomsService.leaveFromMatch(userId, roomKey);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put(':id/filters')
    @ApiOperation({ summary: 'Update room filters' })
    @ApiResponse({ status: 200, description: 'Filters updated successfully.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Room not found or No matches found in room.' })
    @ApiResponse({ status: 500, description: 'Internal Server Error.' })
    async updateFilters(@Req() req: any, @Param('id') roomId: string, @Body() filters: any) {
        try {
            await this.roomsService.updateRoomFilters(req.user.id, roomId, filters);
            return { statusCode: HttpStatus.OK, message: 'Filters updated successfully.' };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.NOT_FOUND,
                        message: error.message,
                    },
                    HttpStatus.NOT_FOUND,
                );
            } else if (error instanceof UnauthorizedException) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.FORBIDDEN,
                        message: error.message,
                    },
                    HttpStatus.FORBIDDEN,
                );
            } else {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Internal Server Error.',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }
    }
}
