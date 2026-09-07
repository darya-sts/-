import { Module } from '@nestjs/common';
import { MarvinbotService } from './marvinbot.service';
import { MarvinbotController } from './marvinbot.controller';

@Module({
  providers: [MarvinbotService],
  controllers: [MarvinbotController],
  exports: [MarvinbotService],
})
export class MarvinbotModule {}