import { ApiProperty } from '@nestjs/swagger';
import { Movie } from './movie.dto';

export class MoviesResponse {
    @ApiProperty({ description: 'Объекты фильмов', type: [Movie] })
    docs: Movie[];

    @ApiProperty({ description: 'Общее количество фильмов' })
    total: number;

    @ApiProperty({ description: 'Лимит' })
    limit: number;

    @ApiProperty({ description: 'Текущая страница' })
    page: number;

    @ApiProperty({ description: 'Общее количество страниц' })
    pages: number;
}
