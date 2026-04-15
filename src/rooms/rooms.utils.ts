import { Genre, Country, Year } from './rooms.interface';
import { KINOPOISK_COUNTRY_BY_ID, KINOPOISK_GENRE_BY_ID } from './kp-filter-values';

export interface ISMFormData {
    excludeGenre: Genre[];
    genres?: Genre[];
    selectedCountries: Country[];
    selectedGenres: Genre[];
    selectedYears: Year[];
    selectedRating: [number, number];
}

function asId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
    return null;
}

function kpGenreName(genre: Genre | null | undefined): string {
    if (genre?.kpName) return genre.kpName.toLocaleLowerCase();
    const id = asId(genre?.id);
    const mapped = id != null ? KINOPOISK_GENRE_BY_ID[id] : undefined;
    return (mapped ?? genre?.label ?? '').toLocaleLowerCase();
}

function kpCountryName(country: Country | null | undefined): string {
    if (country?.kpName) return country.kpName;
    const id = asId(country?.id);
    const mapped = id != null ? KINOPOISK_COUNTRY_BY_ID[id] : undefined;
    return mapped ?? country?.label ?? '';
}

export const constructUrl = (baseURL: string, formData: ISMFormData, page: number): string => {
    const params = new URLSearchParams();

    params.append('page', page.toString());
    formData.selectedYears.forEach((year) => {
        params.append('year', year.label);
    });
    formData.selectedGenres.forEach((genre) => {
        const name = kpGenreName(genre);
        if (name) params.append('genres.name', name);
    });
    formData.excludeGenre.forEach((genre) => {
        const name = kpGenreName(genre);
        if (name) params.append('genres.name', `!${name}`);
    });
    formData.selectedCountries.forEach((country) => {
        const name = kpCountryName(country);
        if (name) params.append('countries.name', name);
    });
    if (formData.selectedRating && formData.selectedRating.length === 2) {
        const [minRating, maxRating] = formData.selectedRating;
        params.append('rating.kp', `${minRating}-${maxRating}`);
    }

    return `${baseURL}limit=10&notNullFields=name&notNullFields=countries.name&${params.toString()}`;
};

/** Normalize DB `movies` column (legacy string JSON or jsonb object). */
export function parseMoviesColumn(raw: unknown): unknown {
    if (raw == null) {
        return null;
    }
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return raw;
}

export type MovieDeck = Readonly<Record<string, unknown> & { docs: ReadonlyArray<unknown> }>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function hasDocsArray(value: Record<string, unknown>): value is Record<string, unknown> & { docs: ReadonlyArray<unknown> } {
    return Array.isArray(value.docs);
}

export function normalizeMovieDeck(raw: unknown): MovieDeck | null {
    if (Array.isArray(raw)) {
        return { docs: raw };
    }
    if (isRecord(raw) && hasDocsArray(raw)) {
        return raw;
    }
    return null;
}
