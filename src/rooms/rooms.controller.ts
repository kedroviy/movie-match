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
    BadRequestException,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { GetUser } from '@src/user/user.interfaces';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@src/auth/guards/public-guard';
import { Match } from '@src/match/match.model';
import { MESSAGES } from '@src/constants';
import { HasRoomResponse } from './dto/has-room-response.dto';
import { MoviesResponse } from './dto/movies-response.dto';
import { CreateRoomDto, CreateRoomKeyResponse } from './dto/create-room.dto';
import { GetUser as GetUserDecorator } from './decorators/get-user.decorators';

@Controller('rooms')
@ApiTags('Rooms')
@ApiBearerAuth()
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Post('create')
    @UseGuards(AuthGuard)
    @ApiCreatedResponse({ type: CreateRoomKeyResponse })
    @ApiConflictResponse({ description: MESSAGES.ROOM_ALREADY_EXIST })
    @ApiBadRequestResponse({ description: MESSAGES.FAILED_TO_CREATE_ROOM })
    async createRoom(
        @GetUserDecorator() user: GetUser,
        @Body() createRoomDto: CreateRoomDto,
    ): Promise<CreateRoomKeyResponse> {
        const { id } = user;
        console.log(`createRoom called for userId: ${id}`);
        try {
            const room = await this.roomsService.createRoom(id, createRoomDto.name, createRoomDto.filters);
            return room;
        } catch (error) {
            console.error('Error creating room:', error);
            if (error instanceof ConflictException) {
                throw new ConflictException(MESSAGES.ROOM_ALREADY_EXIST);
            } else {
                throw new BadRequestException(MESSAGES.FAILED_TO_CREATE_ROOM);
            }
        }
    }

    @Post('join/:key')
    @ApiOperation({ summary: 'Join an existing room' })
    @ApiCreatedResponse({ description: 'Successfully joined the room' })
    @ApiBadRequestResponse({ description: 'User already joined this room' })
    @ApiNotFoundResponse({ description: 'Room not found' })
    async joinRoom(@Param('key') key: string, @Body('userId') userId: number) {
        return this.roomsService.joinRoom(userId, key);
    }

    @Get('user/:userId/hasRoom')
    @ApiParam({ name: 'userId', required: true, description: 'ID пользователя' })
    @ApiOkResponse({ description: 'Статус комнаты для пользователя', type: HasRoomResponse })
    @ApiNotFoundResponse({ description: 'Пользователь не найден' })
    async doesUserHaveRoom(
        @Param('userId') userId: number,
    ): Promise<{ message: string; match?: Match[] } | { message: string; key?: string }> {
        return this.roomsService.doesUserHaveRoom(userId);
    }

    @Post('leave/:key')
    async leaveRoom(@Param('key') key: string, @Body('userId') userId: string) {
        return this.roomsService.leaveFromRoom(key, userId);
    }

    @Post('leave-from-match')
    @UseGuards(AuthGuard)
    async leaveMatch(@Req() req, @Body() body: { userId: number; roomKey: string }) {
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

    @Post(':key/start-match')
    async startMatchController(@Param('key') key: string) {
        const result = await this.roomsService.startMatch(key);
        return result;
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

    @Get(':key/get-filters')
    @ApiOperation({ summary: 'Get room filters' })
    @ApiParam({
        name: 'key',
        type: String,
        description: 'Unique room key',
        required: true,
    })
    @ApiResponse({ status: 200, description: 'Successfully retrieved filters.' })
    @ApiResponse({ status: 404, description: 'Room not found' })
    @ApiResponse({ status: 409, description: 'Failed to parse filters' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getRoomFilters(@Param('key') key: string) {
        try {
            const filters = await this.roomsService.getRoomFilters(key);
            return { statusCode: HttpStatus.OK, filters };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.NOT_FOUND,
                        message: error.message,
                    },
                    HttpStatus.NOT_FOUND,
                );
            } else if (error instanceof ConflictException) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.CONFLICT,
                        message: error.message,
                    },
                    HttpStatus.CONFLICT,
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

    @Get('/:roomKey/get-movies')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get current movies data' })
    @ApiParam({
        name: 'roomKey',
        type: String,
        description: 'Unique room key',
        required: true,
    })
    @ApiResponse({ status: 200, description: 'Successful response', type: MoviesResponse })
    @ApiResponse({ status: 404, description: 'Room or user not found' })
    @ApiResponse({ status: 409, description: 'Conflict' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getNextMovie(@Param('roomKey') roomKey: string): Promise<string> {
        try {
            return this.roomsService.getNextMovie(roomKey);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.NOT_FOUND,
                        message: error.message,
                    },
                    HttpStatus.NOT_FOUND,
                );
            } else if (error instanceof ConflictException) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.CONFLICT,
                        message: error.message,
                    },
                    HttpStatus.CONFLICT,
                );
            } else {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Internal Server Error',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }
    }
}
