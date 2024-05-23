import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    exports: [MovieService],
    controllers: [MovieController],
    providers: [MovieService],
})
export class MovieModule {}
