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
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetMeType } from './user.response.types';
import { User } from '@app/common/decorators/getData/getUserDecorator';
import { GetUser } from '@src/user/user.interfaces';
import { AuthGuard } from '@src/auth/guards/public-guard';
import { MESSAGES } from '@src/constants';

class UpdateUsernameDto {
    userId: string;
    newUsername: string;
}

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiProperty({ description: MESSAGES.USER_EMAIL })
    @ApiQuery({ name: 'userEmail', required: true, description: MESSAGES.USER_EMAIL })
    @ApiCreatedResponse({
        description: MESSAGES.USER_INFROMATION_SUCCESSULLY_RETRIEVED,
        type: GetMeType,
    })
    @ApiNotFoundResponse({ description: MESSAGES.USER_NOT_FOUND })
    @ApiBearerAuth()
    getMe(@User() user: GetUser) {
        return this.userService.getMe(user.email);
    }

    @UseGuards(AuthGuard)
    @Patch('/update-username')
    @ApiBody({
        description: MESSAGES.OPTIONS_FOR_UPDATE_USERNAME,
        type: UpdateUsernameDto,
        required: true,
    })
    @ApiResponse({ status: 200, description: MESSAGES.SUCCESFUL_RESPONSE })
    @ApiResponse({ status: 404, description: MESSAGES.USER_NOT_FOUND })
    @ApiResponse({ status: 500, description: MESSAGES.FAILED_TO_UPDATE })
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
