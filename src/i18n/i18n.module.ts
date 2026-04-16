import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nController } from './i18n.controller';
import { I18nMessage } from './i18n.model';
import { I18nService } from './i18n.service';

@Module({
    imports: [TypeOrmModule.forFeature([I18nMessage])],
    controllers: [I18nController],
    providers: [I18nService],
    exports: [I18nService],
})
export class I18nModule {}
