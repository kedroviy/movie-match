import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany, JoinTable, ManyToMany } from 'typeorm';
import { Match } from '@src/match/match.model';
import { User } from '@src/user/user.model';

@Entity()
@Unique(['key', 'authorId'])
export class Room {
    @PrimaryGeneratedColumn('uuid')
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

    @ManyToMany(() => User)
    @JoinTable()
    users: User[];

    @OneToMany(() => Match, (match) => match.room, { onDelete: 'CASCADE' })
    matches: Match[];
}
