import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.model';
import 'dotenv/config';
import { JwtStrategy } from "@src/auth/strategies/jwt-strategy";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserService } from "@src/user/user.service";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            password: process.env.POSTGRES_PASSWORD,
            username: process.env.POSTGRES_USERNAME,
            entities: [User],
            database: process.env.POSTGRES_DATABASE,
            synchronize: true,
            logging: false,
        }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30d'
            }
        }),
        AuthModule,
        UserModule,
        PassportModule
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtStrategy,
        },
    ],
})
export class AppModule {}
