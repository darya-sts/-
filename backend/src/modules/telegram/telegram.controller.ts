import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DigestService } from '../digest/digest.service';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@ApiExcludeController()
@Controller('api/telegram')
export class TelegramController {
  constructor(
    private readonly digestService: DigestService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {}

  /** Webhook Telegram Bot API */
  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    const expected = this.config.get('TELEGRAM_WEBHOOK_SECRET');
    if (expected && secret && secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const cb = body?.callback_query;
    if (cb) {
      const data: string = cb.data || '';
      const chatId = String(cb.message?.chat?.id || '');
      const messageId = String(cb.message?.message_id || '');
      await this.telegram.answerCallback(cb.id);

      if (data.startsWith('toggle_')) {
        const itemId = data.replace('toggle_', '');
        await this.digestService.toggleItem(itemId, chatId, messageId);
        return { ok: true };
      }
      if (data === 'generate_article') {
        await this.digestService.generateFromTelegram(chatId, messageId);
        return { ok: true };
      }
      if (data === 'cancel') {
        await this.digestService.cancelDigest(chatId, messageId);
        return { ok: true };
      }
    }

    return { ok: true };
  }
}