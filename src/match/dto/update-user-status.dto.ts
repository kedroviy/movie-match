import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MatchUserStatus } from '@src/match/match.model';

export class UpdateUserStatusDto {
    @ApiProperty({ example: '123456', description: 'Room key' })
    @IsString()
    roomKey: string;

    @ApiProperty({ example: 1, description: 'User ID' })
    @IsNumber()
    userId: number;

    @ApiProperty({
        example: MatchUserStatus.ACTIVE,
        enum: MatchUserStatus,
        description: 'User status',
    })
    @IsEnum(MatchUserStatus)
    userStatus: MatchUserStatus;
}
