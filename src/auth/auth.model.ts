import { Entity, Column, Unique, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Unique(['expiryDate', 'email', 'code'])
export class VerifyCode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    code: string;

    @Column()
    expiryDate: Date;
}
