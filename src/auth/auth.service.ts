import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-dto';
import { UserService } from '@src/user/user.service';
import { User } from '@src/user/user.model';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService
    ) {}
    
    async registration(dto: RegisterUserDto): Promise<User> {
        const user = await this.userService.isUserExist({ email: dto.email, username: dto.username });

        if (user) {
            throw new ConflictException('User with this email or username already exists');
        }

        const newUser = await this.userService.create(dto)

        return newUser
    }
}
