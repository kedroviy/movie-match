import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BearerToken, SuccessMessage } from '@src/auth/auth.response.types';
import { Public } from '@src/auth/guards/public-guard';
import { IdTokenDto } from './dto/idtoken-dto';
import { UserAgent } from 'y/common/decorators/getData/userAgent';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Public()
    @ApiCreatedResponse({ type: SuccessMessage })
    @ApiBadRequestResponse({ description: 'Something went wrong.' })
    @ApiConflictResponse({ description: 'User with this email or username already exists' })
    register(@Body() dto: RegisterUserDto) {
        return this.authService.registration(dto);
    }

    @Post('login')
    @Public()
    @ApiCreatedResponse({ type: BearerToken })
    @ApiForbiddenResponse({ description: 'Exceeded the maximum attempts. Please try again in 59s.' })
    @ApiUnauthorizedResponse({ description: 'Incorrect email or password.' })
    login(@Body() dto: LoginDto, @UserAgent() agent: string) {
        return this.authService.login(dto, agent);
    }

    @Post('verify-id-token')
    @Public()
    @ApiCreatedResponse({ type: BearerToken })
    @ApiNotFoundResponse({ description: 'invalid google token.' })
    @ApiConflictResponse({ description: 'User with this email already exists without google provider.' })
    @ApiBadRequestResponse({ description: 'Something went wrong.' })
    verifyIdToken(@Body() dto: IdTokenDto) {
        return this.authService.googleAuthorization(dto.idToken);
    }

    @Post('send-code-to-email')
    @Public()
    @ApiCreatedResponse({ type: SuccessMessage })
    @ApiConflictResponse({ description: 'Error' })
    sendCode(@Body('email') email: string, @Res() res: Response) {
        return this.authService.sendCode(email, res);
    }

    @Post('verify-code')
    @Public()
    @ApiCreatedResponse({ type: SuccessMessage })
    @ApiConflictResponse({ description: 'User with this email not exists' })
    @ApiNotFoundResponse({ description: 'Verification code not found' })
    @ApiBadRequestResponse({ description: 'Verification code not found or has expired or invalid' })
    verifyCode(@Body('email') email: string, @Body('code') code: string, @Res() res: Response) {
        return this.authService.verifyCode(email, code, res);
    }

    @Post('change-password')
    @Public()
    @ApiCreatedResponse({ type: SuccessMessage })
    changePassword(
        @Body('email') email: string,
        @Body('code') code: string,
        @Body('password') password: string,
        @Res() res: Response,
    ) {
        return this.authService.changePassword(email, code, password, res);
    }
}
