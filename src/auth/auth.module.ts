import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@src/user/user.module';
import { JwtModule, JwtService } from "@nestjs/jwt";
import 'dotenv/config';
import { HttpModule } from "@nestjs/axios";
import { UserService } from "@src/user/user.service";

@Module({
    imports: [
        UserModule,
        HttpModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30d'
            }
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, UserService, JwtService],
})
export class AuthModule {}
