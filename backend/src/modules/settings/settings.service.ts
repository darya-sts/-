import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly appLogger: LoggerService,
  ) {}

  private userId() {
    return this.config.get('DEFAULT_USER_ID') || 'default-user';
  }

  async get() {
    const userId = this.userId();
    let settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          keywords: JSON.stringify(['агент', 'LLM', 'инструмент']),
          telegramChatId: this.config.get('TELEGRAM_CHAT_ID') || '',
        },
      });
    }
    return {
      ...settings,
      keywords: settings.keywords ? JSON.parse(settings.keywords) : [],
      categories: settings.categories ? JSON.parse(settings.categories) : {},
    };
  }

  async update(data: {
    keywords?: string[];
    categories?: Record<string, number>;
    telegramChatId?: string;
    scheduleCron?: string;
    timezone?: string;
    maxPostsPerDigest?: number;
    maxPostsPerArticle?: number;
  }) {
    const userId = this.userId();
    const updated = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        keywords: data.keywords ? JSON.stringify(data.keywords) : undefined,
        categories: data.categories ? JSON.stringify(data.categories) : undefined,
        telegramChatId: data.telegramChatId,
        scheduleCron: data.scheduleCron,
        timezone: data.timezone,
        maxPostsPerDigest: data.maxPostsPerDigest,
        maxPostsPerArticle: data.maxPostsPerArticle,
      },
      create: {
        userId,
        keywords: JSON.stringify(data.keywords || []),
        categories: JSON.stringify(data.categories || {}),
        telegramChatId: data.telegramChatId || '',
        scheduleCron: data.scheduleCron || '0 6,18 * * *',
        timezone: data.timezone || 'Asia/Novosibirsk',
        maxPostsPerDigest: data.maxPostsPerDigest || 10,
        maxPostsPerArticle: data.maxPostsPerArticle || 5,
      },
    });
    await this.appLogger.audit('settings.updated', 'UserSettings', updated.id);
    return this.get();
  }

  listExperts() {
    return this.prisma.expert.findMany({ orderBy: { name: 'asc' } });
  }

  async addExpert(name: string, source = 'Telegram') {
    const expert = await this.prisma.expert.upsert({
      where: { name },
      update: { isActive: true, source },
      create: { name, source, isActive: true },
    });
    await this.appLogger.audit('expert.created', 'Expert', expert.id);
    return expert;
  }

  async removeExpert(id: string) {
    await this.prisma.expert.delete({ where: { id } });
    await this.appLogger.audit('expert.deleted', 'Expert', id);
    return { ok: true };
  }
}