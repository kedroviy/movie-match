// update-room-filters.dto.ts
import { IsNotEmpty, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class CountryFilter {
    @IsNotEmpty()
    id: number;

    @IsNotEmpty()
    label: string;
}

class GenreFilter {
    @IsNotEmpty()
    disabled: boolean;

    @IsNotEmpty()
    id: number;

    @IsNotEmpty()
    label: string;
}

export class UpdateRoomFiltersDTO {
    @IsArray()
    @Type(() => CountryFilter)
    selectedCountries: CountryFilter[];

    @IsArray()
    @Type(() => GenreFilter)
    selectedGenres: GenreFilter[];

    @IsArray()
    selectedYears: number[];
}
