import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Favorite {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column()
    movieId: string;
}