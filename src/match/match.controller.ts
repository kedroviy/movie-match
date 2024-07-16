import {
    Body,
    ConflictException,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { LikeMovieDto } from './dto/like-movie.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { updateUserStatusExamples } from './match-swagger-examples';

@ApiTags('Match')
@Controller('match')
export class MatchController {
    constructor(private readonly matchService: MatchService) {}

    @Post('like')
    @ApiOperation({ summary: 'Like a movie' })
    @ApiResponse({ status: 201, description: 'Movie liked successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async likeMovie(@Body() likeMovieDto: LikeMovieDto): Promise<{ message: string }> {
        try {
            const message = await this.matchService.likeMovie(likeMovieDto);
            return { message };
        } catch (error) {
            console.log(error);
            throw new HttpException('Error liking movie', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get(':roomKey/user-status/:userId')
    @ApiOperation({ summary: 'Get User Status By User ID' })
    @ApiParam({
        name: 'roomKey',
        required: true,
        description: 'The key of the room to which the user belongs',
        type: String,
        example: '1234',
    })
    @ApiParam({
        name: 'userId',
        required: true,
        description: 'The ID of the user whose status is being queried',
        type: Number,
        example: 5678,
    })
    @ApiResponse({
        status: 200,
        description: 'User status retrieved successfully',
        schema: {
            example: {
                userId: 5678,
                userStatus: 'WAITING',
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'User status not found',
        schema: {
            example: {
                statusCode: 404,
                message: 'User status not found',
                error: 'Not Found',
            },
        },
    })
    async getUserStatus(
        @Param('roomKey') roomKey: string,
        @Param('userId') userId: number,
    ): Promise<{ userId: number; userStatus: string }> {
        const userStatus = await this.matchService.getUserStatusByUserId(roomKey, userId);
        if (!userStatus) {
            throw new NotFoundException('User status not found');
        }
        return { userId, userStatus };
    }

    @Patch('user-status')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update user status in a match' })
    @ApiBody({
        description: 'Details to update user status',
        type: UpdateUserStatusDto,
        examples: {
            example1: updateUserStatusExamples.request,
        },
    })
    @ApiResponse({
        status: 200,
        description: 'User status updated successfully',
        schema: {
            example: updateUserStatusExamples.response.success,
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Match not found',
        schema: {
            example: updateUserStatusExamples.response.notFound,
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request',
        schema: {
            example: updateUserStatusExamples.response.badRequest,
        },
    })
    async updateUserStatus(@Body() updateUserStatusDto: UpdateUserStatusDto): Promise<string> {
        return this.matchService.updateUserStatus(
            updateUserStatusDto.roomKey,
            updateUserStatusDto.userId,
            updateUserStatusDto.userStatus,
        );
    }

    @Post('check-status/:roomKey')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Check and broadcast status if needed' })
    @ApiParam({
        name: 'roomKey',
        required: true,
        description: 'The key of the room to check the status for',
        type: String,
        example: '1234',
    })
    @ApiBody({
        description: 'User ID for whom the status is being checked',
        schema: {
            type: 'object',
            properties: {
                userId: {
                    type: 'number',
                    description: 'The ID of the user',
                    example: 5678,
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Status checked and broadcasted successfully if needed',
    })
    @ApiResponse({
        status: 404,
        description: 'Match not found',
        schema: {
            example: {
                statusCode: 404,
                message: 'Match not found',
                error: 'Not Found',
            },
        },
    })
    async checkStatus(@Param('roomKey') roomKey: string, @Body('userId') userId: number): Promise<void> {
        await this.matchService.checkAndBroadcastIfNeeded(roomKey, userId);
    }

    @Get('specific-key-info/:roomKey')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get data from a specific room' })
    @ApiParam({
        name: 'roomKey',
        required: true,
        description: 'The key of the room',
        type: String,
        example: '1234',
    })
    @ApiResponse({
        status: 200,
        description: 'Match data received successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Match with this key was not found',
        schema: {
            example: {
                statusCode: 404,
                message: 'Match with this key was not found',
                error: 'Not Found',
            },
        },
    })
    @ApiResponse({ status: 409, description: 'Conflict' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getSpecificMatchData(@Param('roomKey') roomKey: string): Promise<any> {
        try {
            await this.matchService.getCurrentMatchData(roomKey);
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
