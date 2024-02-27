import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.model';
import { CheckUserExistenceParams, CreateUser } from './user.interfaces';
import { genSaltSync, hashSync } from 'bcrypt';
import { GetMeType } from './user.response.types';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}
    
    async createUser(dto: CreateUser): Promise<User> {
        const hashPassword = dto?.password ? this.hashPassword(dto.password) : ''

        const user = this.usersRepository.create({
            username: dto.username,
            email: dto.email,
            password: hashPassword,
            client: dto.client && dto.client
        });

        return this.usersRepository.save(user);
    }

    async getMe(userEmail: string): Promise<GetMeType> {
        const user: User = await this.getUserByEmail(userEmail)

        if (!user) {
            throw new NotFoundException("User does not found.")
        }

        const { id, email, username } = user

        const userObj = { id, username, email }

        return userObj
    }

    async hasUser(params: CheckUserExistenceParams): Promise<boolean> {
        const { username, email } = params
        if (!username && !email) {
            throw new BadRequestException()
        }
    
        const condition: { username?: string; email?: string } = {};
        
        if (username) {
            condition.username = params.username;
        }

        if (email) {
            condition.email = params.email;
        }
    
        const user = await this.usersRepository.findOne({ where: condition });
    
        return !!user;
    }

    async getUserByEmail(email: string): Promise<User> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async getUserById(userId: string): Promise<User> {
        return this.usersRepository.findOne({ where: { id: Number(userId) } });
    }

    private hashPassword(password: string): string {
        return hashSync(password, genSaltSync(10))
    }
}