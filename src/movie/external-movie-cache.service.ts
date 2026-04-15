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

    static buildCacheKeyFromUrl(url: string): string {
        return crypto.createHash('sha256').update(url).digest('hex');
    }

    /** Returns cached JSON or fetches, stores, and returns Kinopoisk payload. */
    async getOrFetch(
        url: string,
        safeFilters: SafeMovieFilters,
        page: number,
        headers: Record<string, string>,
    ): Promise<any> {
        // Back-compat: legacy callers keyed by filters+page. Prefer `getOrFetchByUrl` for canonical caching.
        const cacheKey = ExternalMovieCacheService.buildCacheKey(safeFilters, page);
        const hit = await this.cacheRepository.findOne({ where: { cacheKey } });
        if (hit?.payload) {
            return hit.payload;
        }

        let data: any;
        try {
            const response = await axios.get(url, { headers });
            data = response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const statusText = error.response?.statusText;
                const responseData = error.response?.data as any;
                const upstreamMessage =
                    typeof responseData === 'string'
                        ? responseData
                        : typeof responseData?.message === 'string'
                          ? responseData.message
                          : typeof responseData?.error === 'string'
                            ? responseData.error
                            : undefined;
                const message = `Kinopoisk API error${status ? ` ${status}` : ''}${statusText ? ` ${statusText}` : ''}${
                    upstreamMessage ? `: ${upstreamMessage}` : ''
                }`;
                throw new Error(message);
            }
            throw error;
        }

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

    /**
     * Canonical caching by full URL (filters + page + any notNullFields, etc).
     * This avoids cache misses caused by object-shaped filters / ordering.
     */
    async getOrFetchByUrl(url: string, headers: Record<string, string>): Promise<any> {
        const cacheKey = ExternalMovieCacheService.buildCacheKeyFromUrl(url);
        const hit = await this.cacheRepository.findOne({ where: { cacheKey } });
        if (hit?.payload) {
            return hit.payload;
        }

        let data: any;
        try {
            const response = await axios.get(url, { headers });
            data = response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const statusText = error.response?.statusText;
                const responseData = error.response?.data as any;
                const upstreamMessage =
                    typeof responseData === 'string'
                        ? responseData
                        : typeof responseData?.message === 'string'
                          ? responseData.message
                          : typeof responseData?.error === 'string'
                            ? responseData.error
                            : undefined;
                const message = `Kinopoisk API error${status ? ` ${status}` : ''}${statusText ? ` ${statusText}` : ''}${
                    upstreamMessage ? `: ${upstreamMessage}` : ''
                }`;
                throw new Error(message);
            }
            throw error;
        }

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
