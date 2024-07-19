import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany, JoinTable, ManyToMany } from 'typeorm';
import { Match } from '@src/match/match.model';
import { User } from '@src/user/user.model';

export enum RoomStatus {
    SET = 'SET',
    EXCEPTION = 'EXCEPTION',
}

@Entity()
@Unique(['key', 'authorId'])
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    authorId: number;

    @Column()
    key: string;

    @Column({ nullable: true })
    name: string;

    @Column({
        type: 'enum',
        enum: RoomStatus,
        default: RoomStatus.SET,
    })
    status: RoomStatus;

    @Column({ default: 1 })
    currentPage: number;

    @Column({ type: 'text', nullable: true })
    filters: string;

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
    matchMovies: any;

    @Column({ type: 'json', nullable: true })
    movies: any;
    movieData: any;
}
