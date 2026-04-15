import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.model';
import 'dotenv/config';
import { JwtStrategy } from '@src/auth/strategies/jwt-strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { MatchModule } from './match/match.module';
import { RoomsModule } from './rooms/rooms.module';
import { Room } from '@src/rooms/rooms.model';
import { AttemptModule } from './attempt/attempt.module';
import { Attempt } from '@src/attempt/attempt.model';
import { MovieModule } from './movie/movie.module';
import { FavoriteModule } from './favorite/favorite.module';
import { Favorite } from '@src/favorite/favorite.model';
import { Match } from '@src/match/match.model';
import { EmailModule } from './email/email.module';
import { SendGridModule } from '@anchan828/nest-sendgrid';
import { VerifyCode } from './auth/auth.model';
import { MatchMoviesModule } from './match-movies/match-movies.module';
import { ExternalMovieCache } from './movie/external-movie-cache.entity';
import { FiltersModule } from './filters/filters.module';
import { ExternalFilterValue } from './filters/external-filter-value.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT) || 5432,
            password: process.env.POSTGRES_PASSWORD,
            username: process.env.POSTGRES_USER ?? process.env.POSTGRES_USERNAME,
            entities: [User, Room, Attempt, Favorite, Match, VerifyCode, ExternalMovieCache, ExternalFilterValue],
            database: process.env.POSTGRES_DATABASE,
            synchronize: true,
            ssl: {
                rejectUnauthorized: false,
            },
            logging: ['query'],
        }),
        SendGridModule.forRoot({
            apikey: process.env.SENDGRID_API_KEY,
        }),
        JwtModule,
        AuthModule,
        UserModule,
        PassportModule,
        MatchModule,
        RoomsModule,
        AttemptModule,
        MovieModule,
        FavoriteModule,
        EmailModule,
        MatchMoviesModule,
        FiltersModule,
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
