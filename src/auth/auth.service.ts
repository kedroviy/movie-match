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
import { User } from "@src/user/user.model";


@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}
    
    async registration(dto: RegisterUserDto): Promise<SuccessMessage> {
        const user = await this.userService.isUserExist({ email: dto.email, username: dto.username });

        if (user) {
            throw new ConflictException('User with this email or username already exists');
        }

        const newUser = await this.userService.create(dto)

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
}