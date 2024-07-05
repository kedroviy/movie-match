import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum AttemptType {
    LOGIN = 'LOGIN',
}

@Entity()
export class Attempt {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: AttemptType,
    })
    where: AttemptType;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    exp: Date;

    @Column({ default: 1 })
    count: number;

    @Column({ nullable: true })
    userAgent: string;
}
