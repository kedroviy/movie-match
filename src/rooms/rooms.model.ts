import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany, JoinTable, ManyToMany } from 'typeorm';
import { Match } from '@src/match/match.model';
import { User } from '@src/user/user.model';

export enum RoomStatus {
    ACTIVE = 'ACTIVE',
    WAITING = 'WAITING',
    CLOSED = 'CLOSED',
}

@Entity()
@Unique(['key', 'authorId'])
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    authorId: string;

    @Column()
    key: string;

    @Column({ nullable: true })
    name: string;

    @Column({
        type: 'enum',
        enum: RoomStatus,
        default: RoomStatus.WAITING,
    })
    status: RoomStatus;

    @Column({ type: 'json', nullable: true })
    filters: any;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @ManyToMany(() => User)
    @JoinTable()
    users: User[];

    @OneToMany(() => Match, (match) => match.room, { onDelete: 'CASCADE' })
    matches: Match[];
}
