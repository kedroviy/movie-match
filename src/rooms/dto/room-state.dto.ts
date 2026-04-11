import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchPhase } from '../match-phase.enum';
import { RoomStatus } from '../rooms.model';

export class RoomParticipantStateDto {
    @ApiProperty()
    userId: number;

    @ApiProperty()
    userName: string;

    @ApiProperty()
    role: string;

    @ApiProperty()
    userStatus: string;

    @ApiPropertyOptional({ description: 'Count of liked movie ids this round' })
    likedCount?: number;
}

export class RoomDeckSummaryDto {
    @ApiPropertyOptional()
    docCount: number;

    @ApiPropertyOptional()
    firstMovieId?: number;

    @ApiPropertyOptional()
    lastMovieId?: number;

    @ApiProperty()
    hasDeck: boolean;
}

/** Single aggregate snapshot for clients (replaces ad-hoc polling of several endpoints). */
export class RoomStateDto {
    @ApiProperty()
    roomKey: string;

    @ApiProperty()
    roomId: string;

    @ApiProperty({ enum: MatchPhase })
    matchPhase: MatchPhase;

    @ApiProperty({ enum: RoomStatus })
    roomStatus: RoomStatus;

    @ApiProperty({ description: 'Monotonic; bump on deck / critical room changes' })
    aggregateVersion: number;

    @ApiProperty({ type: [RoomParticipantStateDto] })
    participants: RoomParticipantStateDto[];

    @ApiProperty({ type: RoomDeckSummaryDto })
    deck: RoomDeckSummaryDto;

    @ApiProperty({ description: 'Whether room has saved filters JSON' })
    hasFilters: boolean;

    @ApiPropertyOptional({ description: 'Echo for stale snapshot detection on client' })
    serverTime: string;
}
