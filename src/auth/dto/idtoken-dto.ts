import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdTokenDto {
    @ApiProperty({
        example: '1q2w2e3e32e23d323rfwf',
        required: true,
    })
    @IsNotEmpty()
    readonly idToken: string;
}
