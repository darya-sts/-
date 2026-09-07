import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('api/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Список каналов' })
  list() {
    return this.sourcesService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить канал' })
  create(
    @Body()
    body: { username: string; title?: string; category: string; weight?: number },
  ) {
    return this.sourcesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить канал' })
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ title: string; category: string; weight: number; isActive: boolean }>,
  ) {
    return this.sourcesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить канал' })
  remove(@Param('id') id: string) {
    return this.sourcesService.remove(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Проверить доступность канала' })
  test(@Body() body: { username: string }) {
    return this.sourcesService.test(body.username);
  }

  @Post(':id/parse')
  @ApiOperation({ summary: 'Ручной парсинг канала' })
  parse(@Param('id') id: string) {
    return this.sourcesService.parseNow(id);
  }
}