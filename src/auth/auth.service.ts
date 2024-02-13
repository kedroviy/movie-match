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
import { BearerToken, GetMeType, SuccessMessage } from "@src/auth/types";
import { compareSync } from 'bcrypt';
import { ClientType, User } from "@src/user/user.model";
import { OAuth2Client } from "google-auth-library";
import 'dotenv/config';

@Injectable()
export class AuthService {
    private oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}
    
    async registration(dto: RegisterUserDto): Promise<SuccessMessage> {
        const user = await this.userService.hasUser({ email: dto.email, username: dto.username });

        if (user) {
            throw new ConflictException('User with this email or username already exists');
        }

        const newUser = await this.userService.createUser(dto);

        if (!newUser) {
            throw new BadRequestException()
        }

        return { message: 'User successfully registered.' }
    }

    async login(dto: LoginDto): Promise<BearerToken> {
        const user = await this.userService.getUserByEmail(dto.email)

        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Incorrect email or password.');
        }

        return this.generateTokens(user)
    }

    async getMe(userEmail: string): Promise<GetMeType> {
        const user: User = await this.userService.getUserByEmail(userEmail)

        if (!user) {
            throw new BadRequestException()
        }

        const { id, email, username } = user

        const userObj = { id, username, email }

        return userObj
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