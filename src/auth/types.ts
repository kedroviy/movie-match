import { ApiProperty } from "@nestjs/swagger";

export class SuccessMessage {
    @ApiProperty({ required: true })
    message: string
}

export class BearerToken {
    @ApiProperty({ required: true })
    token: string
}