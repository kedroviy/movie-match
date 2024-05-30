import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.model';
import { CreateUser } from './user.interfaces';
import { genSaltSync, hashSync } from 'bcrypt';
import { GetMeType } from './user.response.types';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private usersRepository: Repository<User>) { }

    private hashPassword(password: string): string {
        return hashSync(password, genSaltSync(10));
    }

    async createUser({ email, password, client }: CreateUser): Promise<User> {
        const hashPassword = password ? this.hashPassword(password) : '';
        const now = new Date();

        const user = this.usersRepository.create({
            username: `user${now.getTime()}`,
            email,
            password: hashPassword,
            client,
        });

        return this.usersRepository.save(user);
    }

    async getMe(userEmail: string): Promise<GetMeType> {
        const user: User = await this.getUserByEmail(userEmail);

        if (!user) {
            throw new NotFoundException('User with this email does not found.');
        }

        const { id, email, username } = user;

        const userObj = { id, username, email };

        return userObj;
    }

    async getUserByEmail(email: string): Promise<User> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async getUserById(userId: string): Promise<User> {
        return this.usersRepository.findOne({ where: { id: Number(userId) } });
    }

    async updateUserPassword(userId: number, newPassword: string): Promise<void> {
        const hashedPassword = await this.hashPassword(newPassword);
        await this.usersRepository.update(userId, { password: hashedPassword });
    }

    async updateUsername(userId: number, newUsername: string): Promise<any> {
        try {
            const user = await this.usersRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new NotFoundException('User not found.');
            }
            user.username = newUsername;
            await this.usersRepository.save(user);
            return user.username;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new ServiceUnavailableException('Service is currently unavailable. Please try again later.');
        }
    }
}
