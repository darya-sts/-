import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarvinbotService } from './marvinbot.service';
import { DEFAULTS } from '../../common/constants/marvinbot.constants';

@ApiTags('marvinbot')
@Controller('api/marvinbot')
export class MarvinbotController {
  constructor(private readonly marvinbot: MarvinbotService) {}

  @Get('health')
  @ApiOperation({ summary: 'Статус MarvinBot и лимиты токенов' })
  health() {
    return {
      status: 'ok',
      defaults: DEFAULTS,
      forceLocal: process.env.MARVINBOT_FORCE_LOCAL === 'true',
      model: process.env.MARVINBOT_MODEL || 'llama3.2',
    };
  }
}