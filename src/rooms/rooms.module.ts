import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@src/rooms/rooms.model';
import { Match } from '@src/match/match.model';
import { UserModule } from '@src/user/user.module';
import { RoomsGateway } from './rooms.gateway';
import { MatchService } from '@src/match/match.service';
import { AuthModule } from '@src/auth/auth.module';
import { MatchMovie } from '@src/match-movies/match-movies.model';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        TypeOrmModule.forFeature([Room, Match, MatchMovie]),
        UserModule,
        forwardRef(() => AuthModule),
        ScheduleModule.forRoot(),
    ],
    providers: [RoomsService, RoomsGateway, MatchService],
    controllers: [RoomsController],
    exports: [RoomsService, RoomsGateway],
})
export class RoomsModule {}
