import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@src/rooms/rooms.model';
import { Match } from '@src/match/match.model';
import { UserModule } from '@src/user/user.module';
import { RoomsGateway } from './rooms.gateway';
import { AuthModule } from '@src/auth/auth.module';
import { MatchMovie } from '@src/match-movies/match-movies.model';
import { ScheduleModule } from '@nestjs/schedule';
import { MovieModule } from '@src/movie/movie.module';
import { RoomStateMachineService } from './room-state-machine.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Room, Match, MatchMovie]),
        UserModule,
        forwardRef(() => AuthModule),
        ScheduleModule.forRoot(),
        MovieModule,
    ],
    providers: [RoomsService, RoomsGateway, RoomStateMachineService],
    controllers: [RoomsController],
    exports: [RoomsService, RoomsGateway, RoomStateMachineService],
})
export class RoomsModule {}
