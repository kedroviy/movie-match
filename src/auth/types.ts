import { ApiProperty } from "@nestjs/swagger";

export class SuccessMessage {
    @ApiProperty({ required: true })
    message: string
}

export class BearerToken {
    @ApiProperty({ required: true })
    token: string
}

export class GetMeType {
    @ApiProperty({ required: true })
    id: number

    @ApiProperty({ required: true })
    email: string

    @ApiProperty({ required: true })
    username: string
}