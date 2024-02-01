import { IsPasswordsMatchingConstraint } from "@app/common/decorators/validation/password-match";
import { IsEmail, IsNotEmpty, MinLength, Validate } from "class-validator";

export class RegisterUserDto {

    @IsEmail()
    readonly email: string;

    @IsNotEmpty()
    readonly username: string;

    @IsNotEmpty()
    @MinLength(6)
    readonly password: string;

    @IsNotEmpty()
    @MinLength(6)
    @Validate(IsPasswordsMatchingConstraint)
    readonly passwordRepeat: string
}