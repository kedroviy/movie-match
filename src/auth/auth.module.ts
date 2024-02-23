import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@src/user/user.module';
import { JwtModule } from "@nestjs/jwt";
import 'dotenv/config';
import { HttpModule } from "@nestjs/axios";
import { UserService } from "@src/user/user.service";
import { AttemptModule } from "@src/attempt/attempt.module";

@Module({
    imports: [
        UserModule,
        HttpModule,
        AttemptModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30d'
            }
        })
    ],
    exports: [JwtModule],
    controllers: [AuthController],
    providers: [AuthService, UserService],
})
export class AuthModule {}
export { JwtModule };

