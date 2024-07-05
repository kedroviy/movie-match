import { Body, Controller, HttpCode, HttpException, HttpStatus, Patch, Post } from '@nestjs/common';
import { LikeMovieDto } from './dto/like-movie.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { updateUserStatusExamples } from './match-swagger-examples';

@ApiTags('match')
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

    @Patch('status')
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
}
