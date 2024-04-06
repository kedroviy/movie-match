import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.model';
import { AuthModule } from '@src/auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
    exports: [UserService, TypeOrmModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
