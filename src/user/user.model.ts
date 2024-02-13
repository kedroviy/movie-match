import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

export enum ClientType {
    GOOGLE = 'GOOGLE',
    NONE = 'NONE',
}

@Entity()
@Unique(["username", "email"])
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({
        type: "enum",
        enum: ClientType,
        default: ClientType.NONE,
    })
    client: ClientType;
}
