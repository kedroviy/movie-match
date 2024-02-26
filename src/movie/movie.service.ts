import { Injectable } from '@nestjs/common';
import { HttpService } from "@nestjs/axios";
import * as process from "process";

@Injectable()
export class MovieService {
    private readonly apiKey = process.env.API_MOVIE_KEY
    constructor(private httpService: HttpService) {}

    async getMovieFromId(movieId: string) {
        const url = `https://api.kinopoisk.dev/v1.4/movie/${movieId}`;
        const config = {
            headers: {
                'accept': 'application/json',
                'X-API-KEY': this.apiKey,
            }
        };

        try {
            const response = await this.httpService.get(url, config).toPromise();
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}
