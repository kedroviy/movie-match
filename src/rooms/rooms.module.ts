import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@src/rooms/rooms.model';
import { Match } from '@src/match/match.model';
import { UserModule } from '@src/user/user.module';
import { RoomsGateway } from './rooms.gateway';
import { MatchService } from '@src/match/match.service';

@Module({
    imports: [TypeOrmModule.forFeature([Room, Match]), UserModule],
    providers: [RoomsService, RoomsGateway, MatchService],
    controllers: [RoomsController],
    exports: [RoomsService],
})
export class RoomsModule {}
