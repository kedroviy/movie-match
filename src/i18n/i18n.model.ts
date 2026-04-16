import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export type LandingLocale = 'en' | 'ru' | 'es' | 'de' | 'ja';

@Entity({ name: 'i18n_messages' })
@Unique('uq_i18n_messages_locale_namespace_key', ['locale', 'namespace', 'key'])
@Index('idx_i18n_messages_namespace_locale', ['namespace', 'locale'])
export class I18nMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 8 })
    locale: LandingLocale;

    @Column({ type: 'varchar', length: 64 })
    namespace: string;

    @Column({ type: 'varchar', length: 128 })
    key: string;

    @Column({ type: 'text' })
    value: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
