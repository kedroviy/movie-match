import { ApiProperty } from "@nestjs/swagger"

export class GetMeType {
    @ApiProperty()
    id: number

    @ApiProperty()
    email: string

    @ApiProperty()
    username: string
}