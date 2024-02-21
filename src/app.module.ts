import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.model';
import 'dotenv/config';
import { JwtStrategy } from "@src/auth/strategies/jwt-strategy";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "./auth/auth.module"
import { PassportModule } from "@nestjs/passport";
import { MatchModule } from './match/match.module';
import { RoomsModule } from './rooms/rooms.module';
import { Room } from "@src/rooms/rooms.model";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            password: process.env.POSTGRES_PASSWORD,
            username: process.env.POSTGRES_USERNAME,
            entities: [User, Room],
            database: process.env.POSTGRES_DATABASE,
            synchronize: true,
            logging: false,
        }),
        JwtModule,
        AuthModule,
        UserModule,
        PassportModule,
        MatchModule,
        RoomsModule
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
