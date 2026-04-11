import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Shared Kinopoisk list response by normalized filters + page; TTL cleaned daily. */
@Entity('external_movie_cache')
@Index(['cacheKey'], { unique: true })
export class ExternalMovieCache {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 128 })
    cacheKey: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;
}
