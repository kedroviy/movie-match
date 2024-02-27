import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from "typeorm";
import { Match } from "@src/match/match.model";

@Entity()
@Unique(["key", "authorId"])
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    authorId: string;

    @Column()
    key: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @OneToMany(() => Match, match => match.room, { onDelete: 'CASCADE' })
    matches: Match[];
}

