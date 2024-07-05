import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { MatchUserStatus } from '@src/match/match.model';

export class UpdateUserStatusDto {
    @ApiProperty({ example: '123456', description: 'Key of the room' })
    @IsString()
    @IsNotEmpty()
    roomKey: string;

    @ApiProperty({ example: 1, description: 'ID of the user' })
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @ApiProperty({ example: MatchUserStatus.ACTIVE, description: 'Status of the user', enum: MatchUserStatus })
    @IsEnum(MatchUserStatus)
    @IsNotEmpty()
    userStatus: MatchUserStatus;
}
