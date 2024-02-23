import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterUserDto } from './dto/register-dto';
import { UserService } from '@src/user/user.service';
import { LoginDto } from './dto/login-dto';
import { BearerToken, SuccessMessage } from "@src/auth/types";
import { compareSync } from 'bcrypt';
import { ClientType, User } from "@src/user/user.model";
import { OAuth2Client } from "google-auth-library";
import 'dotenv/config';
import { AttemptService } from "@src/attempt/attempt.service";
import { AttemptType } from "@src/attempt/attempt.model";

@Injectable()
export class AuthService {
    private oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly attemptService: AttemptService,
    ) {}
    
    async registration(dto: RegisterUserDto): Promise<SuccessMessage> {
        const [checkUserEmail, checkUserName] = await Promise.all([
            this.userService.hasUser({ email: dto.email }),
            this.userService.hasUser({ username: dto.username })
        ]);

        if (checkUserEmail || checkUserName) {
            throw new ConflictException('User with this email or username already exists');
        }

        const newUser = await this.userService.createUser(dto);

        if (!newUser) {
            throw new BadRequestException()
        }

        return { message: 'User successfully registered.' }
    }

    async login(dto: LoginDto, agent: string): Promise<BearerToken> {
        const user = await this.userService.getUserByEmail(dto.email)

        if (user) {
            const attemptCheck = {
                userId: String(user.id),
                where: AttemptType.LOGIN,
                userAgent: agent
            };

            await this.attemptService.check(attemptCheck);

            if (user.client || !compareSync(dto.password, user.password)) {
                throw new UnauthorizedException('Incorrect email or password.');
            }

            await this.attemptService.remove(attemptCheck);
            return this.generateTokens(user)
        } else {
            throw new UnauthorizedException('Incorrect email or password.');
        }
    }

    private async generateTokens(user: User): Promise<BearerToken> {
        const accessToken = this.jwtService.sign({
            id: user.id,
            email: user.email,
        });

        return { token: accessToken };
    }

    async googleAuthorization(idToken: string): Promise<BearerToken> {
        const email = await this.verifyIdToken(idToken);

        if (!email) {
            throw new BadRequestException();
        }

        const { GOOGLE } = ClientType;

        const user = await this.userService.getUserByEmail(email);

        if (user) {
            if (user.client !== GOOGLE) {
                throw new ConflictException('User with this email already exists without google provider');
            }
            
            return this.generateTokens(user)
        }

        const now = new Date();

        const newGoogleUser = {
            email,
            username: `user${now.getTime()}`,
            client: GOOGLE
        }

        const newUser = await this.userService.createUser(newGoogleUser);

        if (!newUser) {
            throw new BadRequestException()
        }

        return this.generateTokens(newUser);
    }

    private async verifyIdToken(idToken: string): Promise<string> {
        try {
            const ticket = await this.oAuth2Client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();

            return payload.email;
        } catch (error) {
            throw new UnauthorizedException('Invalid ID Token');
        }
    }
}