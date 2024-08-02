import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikeMovieDto {
    @ApiProperty({ example: 'room123', description: 'Unique key of the room' })
    @IsString()
    readonly roomKey: string;

    @ApiProperty({ example: 1, description: 'ID of the user' })
    @IsInt()
    readonly userId: number;

    @ApiProperty({ example: 12345, description: 'ID of the movie' })
    @IsInt()
    readonly movieId: number;
}
