import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { ExternalMovieCache } from './external-movie-cache.entity';

export type SafeMovieFilters = {
    excludeGenre: unknown[];
    genres: unknown[];
    selectedYears: unknown[];
    selectedGenres: unknown[];
    selectedCountries: unknown[];
    selectedRating: unknown[];
};

@Injectable()
export class ExternalMovieCacheService {
    constructor(
        @InjectRepository(ExternalMovieCache)
        private readonly cacheRepository: Repository<ExternalMovieCache>,
    ) {}

    static buildCacheKey(safeFilters: SafeMovieFilters, page: number): string {
        const normalized = JSON.stringify({ f: safeFilters, page });
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /** Returns cached JSON or fetches, stores, and returns Kinopoisk payload. */
    async getOrFetch(url: string, safeFilters: SafeMovieFilters, page: number, headers: Record<string, string>): Promise<any> {
        const cacheKey = ExternalMovieCacheService.buildCacheKey(safeFilters, page);
        const hit = await this.cacheRepository.findOne({ where: { cacheKey } });
        if (hit?.payload) {
            return hit.payload;
        }

        const response = await axios.get(url, { headers });
        const data = response.data;

        try {
            await this.cacheRepository.save(
                this.cacheRepository.create({
                    cacheKey,
                    payload: data,
                }),
            );
        } catch {
            const again = await this.cacheRepository.findOne({ where: { cacheKey } });
            if (again?.payload) {
                return again.payload;
            }
            throw new Error('Failed to persist external movie cache');
        }

        return data;
    }

    /** Drop rows older than 24h (invoke from daily room cleanup cron). */
    async purgeExpired(): Promise<void> {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const res = await this.cacheRepository.delete({ createdAt: LessThan(cutoff) });
        console.log(`external_movie_cache purge: removed ${res.affected ?? 0} rows older than 24h`);
    }
}
