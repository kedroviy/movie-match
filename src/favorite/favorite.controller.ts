import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { User } from 'y/common/decorators/getData/getUserDecorator';
import { GetUser } from '@src/user/user.interfaces';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiTags,
} from '@nestjs/swagger';
import { MyFavoriteResponse } from '@src/favorite/favorite.response.types';

@Controller('favorite')
@ApiTags('Favorite')
export class FavoriteController {
    constructor(private readonly favoriteService: FavoriteService) {}

    @Post('add/:movieId')
    @ApiConflictResponse({ description: 'Movie is already in favorites' })
    @ApiNotFoundResponse({ description: 'User is not found.' })
    @ApiBearerAuth()
    addFavorite(@Param('movieId') movieId: string, @User() user: GetUser) {
        return this.favoriteService.addFavorite(movieId, user.id);
    }

    @Get()
    @ApiNotFoundResponse({ description: "User's favorites not found" })
    @ApiInternalServerErrorResponse({ description: 'Failed to fetch movie information' })
    @ApiNotFoundResponse({ description: 'User is not found.' })
    @ApiCreatedResponse({ type: [MyFavoriteResponse] })
    getMyFavorite(@User() user: GetUser) {
        return this.favoriteService.getMyFavorite(user.id);
    }

    @Delete('delete/:movieId')
    @ApiNotFoundResponse({ description: 'Movie has not found in favorites' })
    @ApiNotFoundResponse({ description: 'User is not found.' })
    deleteFromFavorite(@Param('movieId') movieId: string, @User() user: GetUser) {
        return this.favoriteService.deleteFromFavorite(movieId, user.id);
    }
}
