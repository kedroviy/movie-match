import { ApiProperty } from "@nestjs/swagger";

export class SuccessMessage {
    @ApiProperty()
    message: string
}

export class BearerToken {
    @ApiProperty()
    token: string
}