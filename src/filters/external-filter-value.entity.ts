import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ExternalProvider = 'KINOPOISK' | 'UNKNOWN';

export type ExternalFilterField = 'genres.name' | 'countries.name';

@Entity('external_filter_value')
@Index(['provider', 'locale', 'field', 'slug'], { unique: true })
export class ExternalFilterValue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 32 })
    provider: ExternalProvider;

    @Column({ type: 'varchar', length: 16 })
    locale: string;

    @Column({ type: 'varchar', length: 64 })
    field: ExternalFilterField;

    @Column({ type: 'varchar', length: 256 })
    name: string;

    @Column({ type: 'varchar', length: 256 })
    slug: string;

    /**
     * Raw item payload, stored "as it comes" from provider.
     * For Kinopoisk possible-values this is usually `{ name, slug }`.
     */
    @Column({ type: 'jsonb' })
    raw: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;
}

