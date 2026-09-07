import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'marvinbot-studio-api',
      time: new Date().toISOString(),
    };
  }
}