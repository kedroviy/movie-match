import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BearerToken, SuccessMessage } from "@src/auth/types";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    
    @Post('register')    
    @ApiResponse({ status: 201, type: SuccessMessage})
    async register(@Body() dto: RegisterUserDto) {
        try {
            return this.authService.registration(dto);
        } catch (error) {
            throw error
        }
    }

    @Post('login')
    @ApiResponse({ status: 201, type: BearerToken})
    login(@Body() dto: LoginDto) {
        try {
            return this.authService.login(dto)
        } catch (error) {
            throw error
        }
    }

    @Get('me')
    getMe() {
        try {
            return this.authService.getMe()
        } catch (error) {
            throw error
        }
    }
}