import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { BearerToken, GetMeType, SuccessMessage } from "@src/auth/types";
import { User } from "y/common/decorators/getData/getUserDecorator";
import { Public } from "@src/auth/guards/public-guard";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Public()
    @ApiResponse({ status: 201, type: SuccessMessage})
    register(@Body() dto: RegisterUserDto) {
        try {
            return this.authService.registration(dto);
        } catch (error) {
            throw error
        }
    }

    @Post('login')
    @Public()
    @ApiResponse({ status: 201, type: BearerToken})
    login(@Body() dto: LoginDto) {
        try {
            return this.authService.login(dto)
        } catch (error) {
            throw error
        }
    }

    @Get('me')
    @ApiResponse({ status: 201, type: GetMeType})
    getMe(@User() user: GetMeType) {
        try {
            return this.authService.getMe(user.email)
        } catch (error) {
            throw error
        }
    }
}