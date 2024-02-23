import { Module } from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { AttemptController } from './attempt.controller';
import { Attempt } from "@src/attempt/attempt.model";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([Attempt]),
    ],
    exports: [
        AttemptService,
    ],
    controllers: [AttemptController],
    providers: [AttemptService],
})
export class AttemptModule {}
