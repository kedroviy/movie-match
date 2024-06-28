import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Room } from '@src/rooms/rooms.model';

@Entity()
export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    movieId: string;

    @Column()
    userId: number;

    @Column()
    roomKey: string;

    @Column()
    userName: string;

    @Column()
    role: string;

    @Column({ nullable: true })
    vote: boolean;

    @Column()
    roomId: string;

    @ManyToOne(() => Room, (room) => room.matches)
    room: Room;
    users: any;
}
