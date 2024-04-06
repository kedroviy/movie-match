import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { UserService } from '@src/user/user.service';
import { AttemptModule } from '@src/attempt/attempt.module';
import { UserModule } from '@src/user/user.module';
import { EmailModule } from '@src/email/email.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { VerifyCode } from './auth.model';
import 'dotenv/config';
import { AuthGuard } from './guards/public-guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([VerifyCode]),
        ScheduleModule.forRoot(),
        UserModule,
        HttpModule,
        EmailModule,
        AttemptModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30d',
            },
        }),
    ],
    exports: [JwtModule, AuthGuard, AuthService],
    controllers: [AuthController],
    providers: [AuthService, UserService, AuthGuard],
})
export class AuthModule {}
export { JwtModule };
