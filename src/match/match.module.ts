import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '@src/match/match.model';
import { JwtModule } from '@src/auth/auth.module';
import { RoomsModule } from '@src/rooms/rooms.module';
import { Room } from '@src/rooms/rooms.model';
import { MatchController } from './match.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Room, Match]), JwtModule, RoomsModule],
    providers: [MatchGateway, MatchService],
    controllers: [MatchController],
})
export class MatchModule {}
