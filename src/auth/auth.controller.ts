import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
    
    @Post('register')    
    @ApiResponse({ status: 201, description: 'User successfully registered.'})
    register(@Body() dto: RegisterUserDto) {
        try {
            return this.authService.registration(dto);
        } catch (error) {
            throw error
        }
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        try {
            return this.authService.login(dto)
        } catch (error) {
            throw error
        }
    }
}