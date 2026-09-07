import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Сводка дашборда' })
  dashboard() {
    return this.statsService.dashboard();
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Статистика токенов' })
  tokens(@Query('days') days = '14') {
    return this.statsService.tokens(Number(days) || 14);
  }

  @Get('sources')
  @ApiOperation({ summary: 'Статистика по источникам' })
  sources() {
    return this.statsService.sources();
  }
}