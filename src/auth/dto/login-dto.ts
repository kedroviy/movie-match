import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'rehmat.sayani@gmail.com',
        required: true,
    })
    @IsEmail()
    readonly email: string;

    @ApiProperty({
        example: 'Qwerty12345+',
        required: true,
    })
    @IsNotEmpty()
    @MinLength(6)
    readonly password: string;
}
