import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ExternalFilterValue } from './external-filter-value.entity';
import { KinopoiskFiltersClient } from './kinopoisk-filters.client';
import { FiltersService } from './filters.service';
import { FiltersController } from './filters.controller';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([ExternalFilterValue])],
    providers: [KinopoiskFiltersClient, FiltersService],
    controllers: [FiltersController],
    exports: [FiltersService],
})
export class FiltersModule {}

