import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ExternalFilterField, ExternalFilterValue } from './external-filter-value.entity';
import { KinopoiskFiltersClient, KinopoiskPossibleValue } from './kinopoisk-filters.client';
import { URLS } from '@src/constants';

export type FiltersLocale = 'ru';
export type FiltersProvider = 'KINOPOISK';

export type FilterValuesResponse = Readonly<{
    provider: FiltersProvider;
    locale: FiltersLocale;
    genres: KinopoiskPossibleValue[];
    countries: KinopoiskPossibleValue[];
    refreshedAt: string;
}>;

@Injectable()
export class FiltersService {
    constructor(
        @InjectRepository(ExternalFilterValue)
        private readonly repo: Repository<ExternalFilterValue>,
        private readonly kpClient: KinopoiskFiltersClient,
    ) {}

    async getKinopoiskFilters(locale: FiltersLocale): Promise<FilterValuesResponse> {
        // Ensure we have data at least once.
        const existingCount = await this.repo.count({ where: { provider: 'KINOPOISK', locale } });
        if (existingCount === 0) {
            await this.syncKinopoisk(locale);
        }

        const [genres, countries] = await Promise.all([
            this.getValuesFromDb(locale, 'genres.name'),
            this.getValuesFromDb(locale, 'countries.name'),
        ]);

        return {
            provider: 'KINOPOISK',
            locale,
            genres,
            countries,
            refreshedAt: new Date().toISOString(),
        };
    }

    async syncKinopoisk(locale: FiltersLocale): Promise<void> {
        const apiKey = URLS.kp_key;

        const [genres, countries] = await Promise.all([
            this.kpClient.getPossibleValuesByField(apiKey, 'genres.name').catch(async () =>
                this.kpClient.getPossibleValuesByField(apiKey, 'genres'),
            ),
            this.kpClient.getPossibleValuesByField(apiKey, 'countries.name').catch(async () =>
                this.kpClient.getPossibleValuesByField(apiKey, 'countries'),
            ),
        ]);

        await Promise.all([
            this.upsertValues(locale, 'genres.name', genres),
            this.upsertValues(locale, 'countries.name', countries),
        ]);
    }

    private async getValuesFromDb(locale: FiltersLocale, field: ExternalFilterField): Promise<KinopoiskPossibleValue[]> {
        const rows = await this.repo.find({
            where: { provider: 'KINOPOISK', locale, field },
            order: { name: 'ASC' },
            select: { name: true, slug: true },
        });
        return rows.map((r) => ({ name: r.name, slug: r.slug }));
    }

    private async upsertValues(
        locale: FiltersLocale,
        field: ExternalFilterField,
        values: KinopoiskPossibleValue[],
    ): Promise<void> {
        const entities = values.map((v) => {
            const e = new ExternalFilterValue();
            e.provider = 'KINOPOISK';
            e.locale = locale;
            e.field = field;
            e.name = v.name;
            e.slug = v.slug;
            e.raw = { name: v.name, slug: v.slug };
            return e;
        });

        await this.repo.upsert(entities, ['provider', 'locale', 'field', 'slug']);
    }
}

