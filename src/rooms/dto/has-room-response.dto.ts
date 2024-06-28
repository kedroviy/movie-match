import { ApiProperty } from '@nestjs/swagger';
import { Match } from '@src/match/match.model';

export class HasRoomResponse {
    @ApiProperty({ description: 'Message' })
    message: string;

    @ApiProperty({ type: [Match], description: 'List of matches', required: false })
    match?: Match[];

    @ApiProperty({ description: 'Room key', required: false })
    key?: string;
}
