import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@src/user/user.model';

@Entity()
export class Favorite {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    movieId: string;

    @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
    user: User;
}
