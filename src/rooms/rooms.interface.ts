export type FilterOption = { id: string | number; name?: string; label: string; kpName?: string };

export interface SMFormItem<T> {
    id: T;
    disabled?: boolean;
    label: string;
    kpName?: string;
    children?: SMFormItem<T>[];
}

export type Genre = SMFormItem<string | number>;
export type Country = SMFormItem<string | number>;
export type Year = SMFormItem<string | number>;

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
    movies: unknown[];
    votes: Map<string, Map<string, boolean>>;
}

export interface RoomKeyType {
    key: string;
}
