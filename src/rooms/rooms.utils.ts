import { Genre, Country, Year } from './rooms.interface';

export interface ISMFormData {
    excludeGenre: Genre[];
    genres?: Genre[];
    selectedCountries: Country[];
    selectedGenres: Genre[];
    selectedYears: Year[];
}

export const constructUrl = (baseURL: string, formData: ISMFormData, page: number): string => {
    const params = new URLSearchParams();

    params.append('page', page.toString());
    formData.selectedYears.forEach((year) => {
        params.append('year', year.label);
    });
    formData.selectedGenres.forEach((genre) => {
        params.append('genres.name', genre.label.toLocaleLowerCase());
    });
    formData.excludeGenre.forEach((genre) => {
        params.append('genres.name', `%21${genre.label.toLocaleLowerCase()}`);
    });
    formData.selectedCountries.forEach((country) => {
        params.append('countries.name', country.label);
    });
    return `${baseURL}limit=10&notNullFields=rating.kp&notNullFields=name&notNullFields=countries.name&rating.kp=3-10&${params.toString()}`;
};
