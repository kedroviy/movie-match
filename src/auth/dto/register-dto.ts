import { IsPasswordsMatchingConstraint } from "@app/common/decorators/validation/password-match";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength, Validate } from "class-validator";

export class RegisterUserDto {
    @ApiProperty({
        example: 'rehmat.sayani@gmail.com',
        required: true
    })
    @IsEmail()
    readonly email: string;

    @ApiProperty({
        example: 'user12345',
        required: true
    })
    @IsNotEmpty()
    readonly username: string;

    @ApiProperty({
        example: 'Qwerty12345+',
        required: true
    })
    @IsNotEmpty()
    @MinLength(6)
    readonly password: string;

    @ApiProperty({
        example: 'Qwerty12345+',
        required: true
    })
    @IsNotEmpty()
    @MinLength(6)
    @Validate(IsPasswordsMatchingConstraint)
    readonly passwordRepeat: string
}