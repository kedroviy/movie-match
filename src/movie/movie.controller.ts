import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    /**
     * Proxy for Kinopoisk `/v1.4/movie/search`.
     * Example: GET /movie/search?query=matrix&page=1&limit=10
     */
    @Get('search')
    async searchMovies(
        @Query('query') query: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const q = String(query ?? '').trim();
        if (!q) throw new BadRequestException('Query is required');

        const pageNum = page != null ? Number(page) : 1;
        const limitNum = limit != null ? Number(limit) : 10;

        // Return the API payload with `docs` array (list), not a single movie.
        return await this.movieService.searchMovies(q, pageNum, limitNum);
    }
}
