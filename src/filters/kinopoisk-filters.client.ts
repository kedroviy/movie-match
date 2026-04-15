import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export type KinopoiskPossibleValue = Readonly<{
    name: string;
    slug: string;
}>;

function isKinopoiskPossibleValue(value: unknown): value is KinopoiskPossibleValue {
    if (typeof value !== 'object' || value === null) return false;
    const name = Reflect.get(value, 'name');
    const slug = Reflect.get(value, 'slug');
    return typeof name === 'string' && typeof slug === 'string';
}

@Injectable()
export class KinopoiskFiltersClient {
    constructor(private readonly http: HttpService) {}

    async getPossibleValuesByField(apiKey: string, field: string): Promise<KinopoiskPossibleValue[]> {
        const url = `https://api.kinopoisk.dev/v1.4/movie/possible-values-by-field?field=${encodeURIComponent(field)}`;
        const response = await firstValueFrom(
            this.http.get<unknown>(url, {
                headers: { Accept: 'application/json', 'X-API-KEY': apiKey },
            }),
        );

        const data = response.data;
        if (!Array.isArray(data)) {
            throw new Error(`Kinopoisk possible-values returned non-array for field=${field}`);
        }

        const items: KinopoiskPossibleValue[] = [];
        for (const item of data) {
            if (!isKinopoiskPossibleValue(item)) {
                throw new Error(`Kinopoisk possible-values item has unexpected shape for field=${field}`);
            }
            items.push(item);
        }
        return items;
    }
}

