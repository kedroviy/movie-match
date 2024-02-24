import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { BearerToken, SuccessMessage } from "@src/auth/auth.response.types";
import { Public } from "@src/auth/guards/public-guard";
import { IdTokenDto } from "./dto/idtoken-dto";
import { UserAgent } from "y/common/decorators/getData/userAgent";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Public()
    @ApiCreatedResponse({ type: SuccessMessage })
    @ApiBadRequestResponse({ description: "Something went wrong." })
    @ApiConflictResponse({ description: "User with this email or username already exists" })
    register(@Body() dto: RegisterUserDto) {
        try {
            return this.authService.registration(dto);
        } catch (error) {
            throw error;
        }
    }

    @Post('login')
    @Public()
    @ApiCreatedResponse({ type: BearerToken })
    @ApiForbiddenResponse({ description: "Exceeded the maximum attempts. Please try again in 59s." })
    @ApiUnauthorizedResponse({ description: "Incorrect email or password." })
    login(@Body() dto: LoginDto, @UserAgent() agent: string) {
        try {
            return this.authService.login(dto, agent)
        } catch (error) {
            throw error;
        }
    }

    @Post('verify-id-token')
    @Public()
    @ApiCreatedResponse({ type: BearerToken })
    @ApiNotFoundResponse({ description: "invalid google token." })
    @ApiConflictResponse({ description: "User with this email already exists without google provider." })
    @ApiBadRequestResponse({ description: "Something went wrong." })
    verifyIdToken(@Body() dto: IdTokenDto) {
        try {
            return this.authService.googleAuthorization(dto.idToken);
        } catch (error) {
            throw error;
        }
    }
}