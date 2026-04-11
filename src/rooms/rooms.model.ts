import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique,
    OneToMany,
    JoinTable,
    ManyToMany,
    CreateDateColumn,
} from 'typeorm';
import { Match } from '@src/match/match.model';
import { User } from '@src/user/user.model';
import { MatchPhase } from './match-phase.enum';

export enum RoomStatus {
    PENDING = 'PENDING',
    SET = 'SET',
    EXCEPTION = 'EXCEPTION',
}

@Entity()
@Unique(['key', 'authorId'])
export class Room {
    @PrimaryGeneratedColumn('rowid')
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

    @CreateDateColumn()
    createdAt: Date;

    @ManyToMany(() => User)
    @JoinTable()
    users: User[];

    @OneToMany(() => Match, (match) => match.room, { onDelete: 'CASCADE' })
    matches: Match[];

    /** Kinopoisk-style list payload `{ docs, total, ... }` — single deck for the room. */
    @Column({ type: 'jsonb', nullable: true })
    movies: Record<string, unknown> | null;

    /** Bumped whenever deck or match-critical state changes (WS + client refetch). */
    @Column({ type: 'int', default: 0 })
    aggregateVersion: number;

    @Column({ type: 'varchar', length: 32, default: 'LOBBY' })
    matchPhase: MatchPhase;

    /** Last idempotency key applied together with `deckRoundIdempotencyAtVersion`. */
    @Column({ type: 'varchar', length: 128, nullable: true })
    deckRoundIdempotencyKey: string | null;

    /** `aggregateVersion` snapshot when `deckRoundIdempotencyKey` was consumed (round settled). */
    @Column({ type: 'int', nullable: true })
    deckRoundIdempotencyAtVersion: number | null;
}
