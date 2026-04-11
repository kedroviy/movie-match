import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckStatusDto {
    @IsInt()
    userId: number;

    /** Same key + same completed round → server no-ops (idempotent). */
    @IsOptional()
    @IsString()
    @MaxLength(128)
    @ApiPropertyOptional({ maxLength: 128 })
    idempotencyKey?: string;
}
