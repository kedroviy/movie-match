import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetMeType } from './user.response.types';
import { User } from '@app/common/decorators/getData/getUserDecorator';
import { GetUser } from "@src/user/user.interfaces";

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Get('me')
    @ApiCreatedResponse({ type: GetMeType})
    @ApiNotFoundResponse({ description: "User does not found." })
    @ApiBearerAuth()
    getMe(@User() user: GetUser) {
        try {
            return this.userService.getMe(user.email)
        } catch (error) {
            throw error;
        }
    }
}