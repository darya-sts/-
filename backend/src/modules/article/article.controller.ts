import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from './article.service';

@ApiTags('articles')
@Controller('api/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Список статей' })
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.articleService.list(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить статью' })
  get(@Param('id') id: string) {
    return this.articleService.get(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Редактировать статью' })
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; status?: string },
  ) {
    return this.articleService.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Опубликовать статью' })
  publish(@Param('id') id: string) {
    return this.articleService.publish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить статью' })
  remove(@Param('id') id: string) {
    return this.articleService.remove(id);
  }
}