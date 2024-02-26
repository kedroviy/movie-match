import { ApiProperty } from "@nestjs/swagger";

export class MyFavoriteResponse {
    @ApiProperty()
    movieId: string
}