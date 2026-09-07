import { Module, forwardRef } from '@nestjs/common';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { MarvinbotModule } from '../marvinbot/marvinbot.module';

@Module({
  imports: [forwardRef(() => TelegramModule), MarvinbotModule],
  providers: [DigestService],
  controllers: [DigestController],
  exports: [DigestService],
})
export class DigestModule {}