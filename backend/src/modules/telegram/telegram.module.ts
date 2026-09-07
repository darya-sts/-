import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { DigestModule } from '../digest/digest.module';

@Module({
  imports: [forwardRef(() => DigestModule)],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}