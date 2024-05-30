import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { GetMeType } from './user.response.types';
import { User } from '@app/common/decorators/getData/getUserDecorator';
import { GetUser } from '@src/user/user.interfaces';
import { AuthGuard } from '@src/auth/guards/public-guard';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiCreatedResponse({ type: GetMeType })
    @ApiNotFoundResponse({ description: 'User does not found.' })
    @ApiBearerAuth()
    getMe(@User() user: GetUser) {
        return this.userService.getMe(user.email);
    }

    @UseGuards(AuthGuard)
    @Patch('/update-username')
    async updateUsername(@Body() body) {
        try {
            const { userId, newUsername } = body;
            return await this.userService.updateUsername(userId, newUsername);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update username. Please try again later.');
        }
    }
}
