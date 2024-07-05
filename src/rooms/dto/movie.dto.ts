import { ApiProperty } from '@nestjs/swagger';

export class Poster {
    @ApiProperty({ description: 'URL постера' })
    url: string = 'default-poster-url';

    @ApiProperty({ description: 'URL превью постера', nullable: true })
    previewUrl: string;
}

export class Backdrop {
    @ApiProperty({ description: 'URL заднего плана', nullable: true })
    url: string;

    @ApiProperty({ description: 'URL превью заднего плана', nullable: true })
    previewUrl: string;
}

export class Genre {
    @ApiProperty({ description: 'Название жанра' })
    name: string;
}

export class Country {
    @ApiProperty({ description: 'Название страны' })
    name: string = 'Unknown Country';
}

export class ReleaseYear {
    @ApiProperty({ description: 'Начало выпуска', nullable: true })
    start?: number;

    @ApiProperty({ description: 'Конец выпуска', nullable: true })
    end?: number;
}

export class Rating {
    @ApiProperty({ description: 'Рейтинг KP', nullable: true })
    kp?: number;

    @ApiProperty({ description: 'Рейтинг IMDB', nullable: true })
    imdb?: number;

    @ApiProperty({ description: 'Рейтинг кинокритиков', nullable: true })
    filmCritics?: number;

    @ApiProperty({ description: 'Рейтинг российских кинокритиков', nullable: true })
    russianFilmCritics?: number;

    @ApiProperty({ description: 'Ожидание рейтинга', nullable: true })
    await?: number;
}

export class Votes {
    @ApiProperty({ description: 'Голоса KP', nullable: true })
    kp?: number;

    @ApiProperty({ description: 'Голоса IMDB', nullable: true })
    imdb?: number;

    @ApiProperty({ description: 'Голоса кинокритиков', nullable: true })
    filmCritics?: number;

    @ApiProperty({ description: 'Голоса российских кинокритиков', nullable: true })
    russianFilmCritics?: number;

    @ApiProperty({ description: 'Ожидание голосов', nullable: true })
    await?: number;
}

export class Movie {
    @ApiProperty({ description: 'ID фильма' })
    id: number = 0;

    @ApiProperty({ description: 'Название фильма', nullable: true })
    name?: string = 'Unknown Title';

    @ApiProperty({ description: 'Альтернативное название фильма', nullable: true })
    alternativeName?: string = 'Unknown Title';

    @ApiProperty({ description: 'Английское название фильма', nullable: true })
    enName?: string;

    @ApiProperty({ description: 'Тип фильма' })
    type: string = 'Unknown';

    @ApiProperty({ description: 'Номер типа' })
    typeNumber: number = 0;

    @ApiProperty({ description: 'Год выпуска', nullable: true })
    year?: number = 0;

    @ApiProperty({ description: 'Описание фильма', nullable: true })
    description?: string = 'No description available';

    @ApiProperty({ description: 'Короткое описание фильма', nullable: true })
    shortDescription?: string = 'No description available';

    @ApiProperty({ description: 'Статус фильма', nullable: true })
    status?: string = 'Unknown';

    @ApiProperty({ description: 'Длина фильма', nullable: true })
    movieLength?: number = 0;

    @ApiProperty({ description: 'Общая длина сериала', nullable: true })
    totalSeriesLength?: number = 0;

    @ApiProperty({ description: 'Длина серии', nullable: true })
    seriesLength?: number = 0;

    @ApiProperty({ description: 'Возрастной рейтинг', nullable: true })
    ageRating?: number = 0;

    @ApiProperty({ description: 'Постер фильма', type: Poster, nullable: true })
    poster?: Poster = new Poster();

    @ApiProperty({ description: 'Задний план фильма', type: Backdrop, nullable: true })
    backdrop?: Backdrop = new Backdrop();

    @ApiProperty({ description: 'Жанры фильма', type: [Genre] })
    genres: Genre[] = [];

    @ApiProperty({ description: 'Страны производства', type: [Country] })
    countries: Country[] = [];

    @ApiProperty({ description: 'Годы выпуска', type: [ReleaseYear], nullable: true })
    releaseYears?: ReleaseYear[] = [];

    @ApiProperty({ description: 'Рейтинг фильма', type: Rating, nullable: true })
    rating?: Rating = new Rating();

    @ApiProperty({ description: 'Голоса', type: Votes, nullable: true })
    votes?: Votes = new Votes();

    @ApiProperty({ description: 'Популярность в топ-10', nullable: true })
    top10?: number = null;

    @ApiProperty({ description: 'Популярность в топ-250', nullable: true })
    top250?: number = null;

    @ApiProperty({ description: 'Доступность билетов', nullable: true })
    ticketsOnSale?: boolean = false;

    @ApiProperty({ description: 'Является ли сериалом' })
    isSeries: boolean = false;
}
