import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@src/rooms/rooms.model';

@Module({
    imports: [TypeOrmModule.forFeature([Room])],
    exports: [RoomsService],
    controllers: [RoomsController],
    providers: [RoomsService],
})
export class RoomsModule {}
