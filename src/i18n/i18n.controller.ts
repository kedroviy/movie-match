import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { I18nService } from './i18n.service';

@Controller('api/v1/i18n')
@ApiTags('i18n')
export class I18nController {
    constructor(private readonly i18nService: I18nService) {}

    @Get('landing')
    @ApiOperation({ summary: 'Landing dictionary by locale (SSR friendly)' })
    @ApiQuery({
        name: 'locale',
        required: false,
        description: 'Requested locale code. Supported: en, ru, es, de, ja',
    })
    async getLandingDictionary(@Query('locale') locale?: string) {
        return this.i18nService.getLandingDictionary(locale);
    }
}
