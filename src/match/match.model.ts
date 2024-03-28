import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Room } from '@src/rooms/rooms.model';

@Entity()
export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    movieId: string;

    @Column()
    userId: string;

    @Column()
    userName: string;

    @Column({ nullable: true })
    vote: string;

    @Column()
    roomId: number;

    @ManyToOne(() => Room, (room) => room.matches)
    room: Room;
}
