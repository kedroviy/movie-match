import { Body, Controller, HttpCode, HttpException, HttpStatus, Patch, Post } from '@nestjs/common';
import { LikeMovieDto } from './dto/like-movie.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

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
    @ApiResponse({ status: 200, description: 'User status updated successfully' })
    @ApiResponse({ status: 404, description: 'Match not found' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async updateUserStatus(@Body() updateUserStatusDto: UpdateUserStatusDto): Promise<string> {
        return this.matchService.updateUserStatus(
            updateUserStatusDto.roomKey,
            updateUserStatusDto.userId,
            updateUserStatusDto.userStatus,
        );
    }
}
