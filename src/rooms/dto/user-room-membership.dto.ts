import { ApiProperty } from '@nestjs/swagger';

export class UserRoomMembershipDto {
    @ApiProperty({ example: '482931' })
    roomKey: string;

    @ApiProperty({ example: '1' })
    roomId: string;

    @ApiProperty({ example: 'admin', enum: ['admin', 'participant'] })
    role: string;

    @ApiProperty({ description: 'True if this user created the room (room.authorId)' })
    isAuthor: boolean;

    @ApiProperty({ example: 'ACTIVE' })
    userStatus: string;

    @ApiProperty({ example: 'LOBBY' })
    matchPhase: string;

    @ApiProperty({ example: 'PENDING' })
    roomStatus: string;

    @ApiProperty({ nullable: true })
    roomName: string | null;
}
