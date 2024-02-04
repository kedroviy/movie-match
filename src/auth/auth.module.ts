import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@src/user/user.module';
import { JwtModule } from "@nestjs/jwt";
import 'dotenv/config';

@Module({
    imports: [
        UserModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30d'
            }
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
