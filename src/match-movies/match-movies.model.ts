import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class MatchMovie {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    roomKey: string;

    @Column()
    userId: string;

    @Column()
    movieId: string;

    @Column('json')
    movieData: any;
}
