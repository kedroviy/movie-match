import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.model';
import { RegisterUserDto } from '@src/auth/dto/register-dto';
import { CheckUserExistenceParams } from './interfaces';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>
    ) {}
    
    async create(dto: RegisterUserDto): Promise<User> {
        const hashPassword = dto?.password ? this.hashPassword(dto.password) : null

        const user = this.usersRepository.create({
            username: dto.username,
            email: dto.email,
            password: hashPassword
        });

        return this.usersRepository.save(user);
    }

    async isUserExist(params: CheckUserExistenceParams): Promise<boolean> {
        if (!params.username && !params.email) {
            throw new BadRequestException()
        }
    
        const condition: { username?: string; email?: string } = {};
        
        if (params.username) {
            condition.username = params.username;
        }

        if (params.email) {
            condition.email = params.email;
        }
    
        const user = await this.usersRepository.findOne({ where: condition });
    
        return !!user;
    }

    async getUserByEmail(email: string): Promise<User> {
        return this.usersRepository.findOne({ where: { email } });
    }

    private hashPassword(password: string): string {
        return hashSync(password, genSaltSync(10))
    }
}