import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Match } from "@src/match/match.model";
import { JwtModule } from "@src/auth/auth.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Match]),
        JwtModule
    ],
    providers: [MatchGateway, MatchService],
})
export class MatchModule {}
