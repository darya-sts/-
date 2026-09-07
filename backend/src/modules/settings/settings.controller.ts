import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('api')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Получить настройки' })
  get() {
    return this.settingsService.get();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Обновить настройки' })
  update(
    @Body()
    body: {
      keywords?: string[];
      categories?: Record<string, number>;
      telegramChatId?: string;
      scheduleCron?: string;
      timezone?: string;
      maxPostsPerDigest?: number;
      maxPostsPerArticle?: number;
    },
  ) {
    return this.settingsService.update(body);
  }

  @Get('experts')
  @ApiOperation({ summary: 'Список экспертов' })
  experts() {
    return this.settingsService.listExperts();
  }

  @Post('experts')
  @ApiOperation({ summary: 'Добавить эксперта' })
  addExpert(@Body() body: { name: string; source?: string }) {
    return this.settingsService.addExpert(body.name, body.source);
  }

  @Delete('experts/:id')
  @ApiOperation({ summary: 'Удалить эксперта' })
  removeExpert(@Param('id') id: string) {
    return this.settingsService.removeExpert(id);
  }
}