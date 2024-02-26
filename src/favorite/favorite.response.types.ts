import { ApiProperty } from "@nestjs/swagger";

export class MyFavoriteResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    posterUrl: string;
}