import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchMovie } from './match-movies.model';

@Module({
    imports: [TypeOrmModule.forFeature([MatchMovie])],
    exports: [TypeOrmModule],
})
export class MatchMoviesModule {}
