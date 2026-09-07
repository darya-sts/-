import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DigestService } from '../digest/digest.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly digestService: DigestService,
    private readonly config: ConfigService,
  ) {}

  /** CRON: 06:00 и 18:00 по Новосибирску (UTC+7) */
  @Cron('0 6,18 * * *', { timeZone: 'Asia/Novosibirsk', name: 'digest-generation' })
  async handleDigestGeneration() {
    this.logger.log('Запуск планового сбора дайджеста (Asia/Novosibirsk)');
    try {
      await this.digestService.runDigestCycle();
    } catch (e: any) {
      this.logger.error(`Ошибка CRON дайджеста: ${e.message}`);
    }
  }

  /** Каждый час: напоминания и очистка */
  @Cron('15 * * * *', { timeZone: 'Asia/Novosibirsk', name: 'digest-maintenance' })
  async handleMaintenance() {
    try {
      await this.digestService.sendReminders();
      await this.digestService.cleanupOldDigests();
    } catch (e: any) {
      this.logger.error(`Ошибка maintenance: ${e.message}`);
    }
  }
}