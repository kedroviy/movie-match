import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalMovieCache } from './external-movie-cache.entity';
import { ExternalMovieCacheService } from './external-movie-cache.service';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([ExternalMovieCache])],
    exports: [MovieService, ExternalMovieCacheService],
    controllers: [MovieController],
    providers: [MovieService, ExternalMovieCacheService],
})
export class MovieModule {}
