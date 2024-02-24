import { ApiProperty } from "@nestjs/swagger"

export class RoomKeyResponse {
    @ApiProperty()
    key: string;
}