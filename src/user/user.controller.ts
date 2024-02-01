import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from '@src/auth/dto/register-dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
}
