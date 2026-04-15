import { Controller, Get, Query } from '@nestjs/common';
import { FiltersLocale, FiltersService } from './filters.service';

@Controller('filters')
export class FiltersController {
    constructor(private readonly filtersService: FiltersService) {}

    @Get()
    async getFilters(@Query('locale') locale?: FiltersLocale) {
        const effectiveLocale: FiltersLocale = locale ?? 'ru';
        return this.filtersService.getKinopoiskFilters(effectiveLocale);
    }
}

