import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';

@Module({
  providers: [MatchGateway, MatchService],
})
export class MatchModule {}
