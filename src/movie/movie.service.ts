import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as process from 'process';

@Injectable()
export class MovieService {
    private readonly apiKey = process.env.API_MOVIE_KEY;
    constructor(private httpService: HttpService) {}

    async getMovieFromId(movieId: string) {
        const url = `https://api.kinopoisk.dev/v1.4/movie/${movieId}`;
        const config = {
            headers: {
                accept: 'application/json',
                'X-API-KEY': this.apiKey,
            },
        };

        try {
            const response = await this.httpService.get(url, config).toPromise();
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search movies by title (Kinopoisk/PoiskKino `/v1.4/movie/search`).
     * Returns the list payload (typically `{ docs, total, page, limit }`).
     */
    async searchMovies(query: string, page = 1, limit = 10) {
        const safeQuery = String(query ?? '').trim();
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;

        const url = `https://api.kinopoisk.dev/v1.4/movie/search?page=${safePage}&limit=${safeLimit}&query=${encodeURIComponent(
            safeQuery,
        )}`;
        const config = {
            headers: {
                accept: 'application/json',
                'X-API-KEY': this.apiKey,
            },
        };

        const response = await this.httpService.get(url, config).toPromise();
        return response.data;
    }
}
