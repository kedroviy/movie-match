import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.model';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private usersRepository: Repository<User>) { }
    
    async create(): Promise<User> {
        const user = this.usersRepository.create({
            username: 'test',
            email: 'test',
            password: 'test'
        });

        return await this.usersRepository.save(user);
    }
}