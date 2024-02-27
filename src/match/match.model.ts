import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Room } from "@src/rooms/rooms.model";

@Entity()
export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    movieId: string;

    @Column()
    userId: string;

    @ManyToOne(() => Room, room => room.matches)
    room: Room;
}