import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetMeType } from './types';
import { User } from '@app/common/decorators/getData/getUserDecorator';
import { GetUser } from "@src/user/interfaces";

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Get('me')
    @ApiResponse({ status: 201, type: GetMeType})
    getMe(@User() user: GetUser) {
        try {
            return this.userService.getMe(user.email)
        } catch (error) {
            throw error;
        }
    }
}