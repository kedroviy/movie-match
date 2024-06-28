import { ApiProperty } from '@nestjs/swagger';

export class Movie {
    @ApiProperty({ description: 'ID фильма' })
    id: number;

    @ApiProperty({ description: 'Название фильма', nullable: true })
    name: string;

    @ApiProperty({ description: 'Альтернативное название фильма', nullable: true })
    alternativeName: string;

    @ApiProperty({ description: 'Тип фильма' })
    type: string;

    @ApiProperty({ description: 'Номер типа' })
    typeNumber: number;

    @ApiProperty({ description: 'Год выпуска' })
    year: number;

    @ApiProperty({ description: 'Описание фильма', nullable: true })
    description: string;

    @ApiProperty({ description: 'Короткое описание фильма', nullable: true })
    shortDescription: string;

    @ApiProperty({ description: 'Статус фильма', nullable: true })
    status: string;

    @ApiProperty({ description: 'Длина фильма', nullable: true })
    movieLength: number;

    @ApiProperty({ description: 'Общая длина сериала', nullable: true })
    totalSeriesLength: number;

    @ApiProperty({ description: 'Длина серии', nullable: true })
    seriesLength: number;

    @ApiProperty({ description: 'Возрастной рейтинг', nullable: true })
    ageRating: number;
}
