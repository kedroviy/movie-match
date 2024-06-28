import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { Favorite } from '@src/favorite/favorite.model';
import { Match } from '@src/match/match.model';

export enum ClientType {
    GOOGLE = 'GOOGLE',
    NONE = 'NONE',
}

@Entity()
@Unique(['username', 'email'])
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
        type: 'enum',
        enum: ClientType,
        default: ClientType.NONE,
    })
    client: ClientType;

    @OneToMany(() => Favorite, (favorite) => favorite.user)
    favorites: Favorite[];

    @OneToMany(() => Match, (match) => match.room, { onDelete: 'CASCADE' })
    matches: Match[];
    matchMovies: any;
}
