import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Room } from '@src/rooms/rooms.model';

export enum MatchUserStatus {
    ACTIVE = 'ACTIVE',
    WAITING = 'WAITING',
    CLOSED = 'CLOSED',
}

@Entity()
export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('simple-array', { nullable: true })
    movieId: number[];

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

    @Column()
    userStatus: string;

    @ManyToOne(() => Room, (room) => room.matches)
    room: Room;
    users: any;
}
