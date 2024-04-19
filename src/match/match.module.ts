import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '@src/match/match.model';
import { JwtModule } from '@src/auth/auth.module';
import { RoomsModule } from '@src/rooms/rooms.module';
import { Room } from '@src/rooms/rooms.model';

@Module({
    imports: [
        TypeOrmModule.forFeature([Room, Match]),
        RoomsModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30d',
            },
        }),
    ],
    providers: [MatchGateway, MatchService],
})
export class MatchModule {}
