export type FilterOption = { id: number; name?: string; label: string };

export interface SMFormItem<T> {
    id: T;
    disabled?: boolean;
    label: string;
    children?: SMFormItem<T>[];
}

export type Genre = SMFormItem<number>;
export type Country = SMFormItem<number | string>;
export type Year = SMFormItem<number | string>;

export interface ISMFormData {
    excludeGenre: Genre[];
    genres?: Genre[];
    selectedCountries: Country[];
    selectedGenres: Genre[];
    selectedYears: Year[];
}

export interface RoomState {
    page: number;
    currentMovieIndex: number;
    movies: any[];
    votes: Map<string, Map<string, boolean>>;
}

export interface RoomKeyType {
    key: string;
}
