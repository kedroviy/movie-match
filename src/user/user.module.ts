import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.model';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    exports: [UserService, TypeOrmModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
