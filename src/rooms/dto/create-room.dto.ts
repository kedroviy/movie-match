import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({ example: 'My Room', description: 'The name of the room' })
    name?: string;

    @ApiProperty({ example: { genre: 'Action' }, description: 'Filters to apply to the room' })
    filters?: any;
}

export class CreateRoomKeyResponse {
    @ApiProperty({ example: 'room-key-123', description: 'The key of the created room' })
    roomKey: string;
}
