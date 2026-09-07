import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DigestService } from './digest.service';

@ApiTags('digests')
@Controller('api/digests')
export class DigestController {
  constructor(private readonly digestService: DigestService) {}

  @Get()
  @ApiOperation({ summary: 'Список дайджестов' })
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.digestService.listDigests(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали дайджеста' })
  get(@Param('id') id: string) {
    return this.digestService.getDigest(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Ручная генерация дайджеста' })
  generate() {
    return this.digestService.runDigestCycle({ manual: true });
  }

  @Post(':id/select')
  @ApiOperation({ summary: 'Выбор постов в дайджесте (дубль Telegram UI)' })
  select(@Param('id') id: string, @Body() body: { itemIds: string[] }) {
    return this.digestService.selectItems(id, body.itemIds || []);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Подтвердить выбор и сгенерировать статью' })
  approve(@Param('id') id: string) {
    return this.digestService.approveAndGenerate(id);
  }
}