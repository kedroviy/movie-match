import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { BearerToken, SuccessMessage } from "@src/auth/types";
import { Public } from "@src/auth/guards/public-guard";
import { IdTokenDto } from "./dto/idtoken-dto";
import { UserAgent } from "y/common/decorators/getData/userAgent";

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
            throw error;
        }
    }

    @Post('login')
    @Public()
    @ApiResponse({ status: 201, type: BearerToken})
    login(@Body() dto: LoginDto, @UserAgent() agent: string) {
        try {
            return this.authService.login(dto, agent)
        } catch (error) {
            throw error;
        }
    }

    @Post('verify-id-token')
    @Public()
    @ApiResponse({ status: 201, type: BearerToken})
    verifyIdToken(@Body() dto: IdTokenDto) {
        try {
            return this.authService.googleAuthorization(dto.idToken);
        } catch (error) {
            throw error;
        }
    }
}