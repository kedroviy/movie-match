import { ApiProperty } from "@nestjs/swagger"

export class GetMeType {
    @ApiProperty({ required: true })
    id: number

    @ApiProperty({ required: true })
    email: string

    @ApiProperty({ required: true })
    username: string
}