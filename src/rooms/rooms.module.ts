import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@src/rooms/rooms.model';
import { Match } from '@src/match/match.model';
import { UserModule } from '@src/user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([Room, Match]), UserModule],
    exports: [RoomsService],
    controllers: [RoomsController],
    providers: [RoomsService],
})
export class RoomsModule {}
