import { ApiProperty } from '@nestjs/swagger';

export class RoomKeyResponse {
    @ApiProperty()
    key: string;
}

export class RoomJoinResponse {
    @ApiProperty()
    message: string;
}
