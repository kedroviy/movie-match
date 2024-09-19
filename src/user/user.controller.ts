import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    Param,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiParam,
    ApiProperty,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetMeType } from './user.response.types';
import { User } from '@app/common/decorators/getData/getUserDecorator';
import { GetUser } from '@src/user/user.interfaces';
import { AuthGuard } from '@src/auth/guards/public-guard';
import { MESSAGES, METHODES } from '@src/constants';

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

    @Delete(':email')
    @HttpCode(HttpStatus.OK)
    @ApiProperty({ description: METHODES.DELETE_ACCOUNT })
    @ApiParam({ name: 'email', required: true, description: MESSAGES.USER_EMAIL })
    @ApiResponse({
        status: 200,
        description: MESSAGES.ACCOUNT_SUCCESSFULLY_DELETED,
        schema: { example: { message: MESSAGES.ACCOUNT_SUCCESSFULLY_DELETED } },
    })
    @ApiResponse({
        status: 404,
        description: MESSAGES.USER_NOT_FOUND,
        schema: { example: { message: MESSAGES.USER_NOT_FOUND } },
    })
    @ApiResponse({ status: 500, description: 'An error occurred while deleting the account' })
    async deleteUser(@Param('email') email: string): Promise<{ message: string }> {
        try {
            await this.userService.deleteUserAccount(email);
            return { message: MESSAGES.ACCOUNT_SUCCESSFULLY_DELETED };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
            }
            throw new Error('An error occurred while deleting the account.');
        }
    }
}
