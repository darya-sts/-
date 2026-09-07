import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { LoggerService } from '../../common/logger/logger.service';
import { CATEGORIES } from '../../common/constants/marvinbot.constants';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly appLogger: LoggerService,
  ) {}

  list() {
    return this.prisma.telegramSource.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: {
    username: string;
    title?: string;
    category: string;
    weight?: number;
  }) {
    const username = data.username.replace(/^@/, '').trim().toLowerCase();
    if (!/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(username)) {
      throw new BadRequestException('Укажите публичный @username канала');
    }
    if (!CATEGORIES.includes(data.category as any)) {
      throw new BadRequestException(`Категория должна быть одной из: ${CATEGORIES.join(', ')}`);
    }
    const weight = Math.max(1, Math.min(5, data.weight ?? 1));
    const test = await this.telegram.testChannel(username);
    const title = data.title || test.title || username;

    const source = await this.prisma.telegramSource.create({
      data: {
        username,
        title,
        category: data.category,
        weight,
        isActive: test.ok,
      },
    });
    await this.appLogger.audit('source.created', 'TelegramSource', source.id, { username });
    return { ...source, test };
  }

  async update(
    id: string,
    data: Partial<{ title: string; category: string; weight: number; isActive: boolean }>,
  ) {
    await this.get(id);
    if (data.category && !CATEGORIES.includes(data.category as any)) {
      throw new BadRequestException('Некорректная категория');
    }
    if (data.weight != null) data.weight = Math.max(1, Math.min(5, data.weight));
    const updated = await this.prisma.telegramSource.update({ where: { id }, data });
    await this.appLogger.audit('source.updated', 'TelegramSource', id);
    return updated;
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.telegramSource.delete({ where: { id } });
    await this.appLogger.audit('source.deleted', 'TelegramSource', id);
    return { ok: true };
  }

  async get(id: string) {
    const source = await this.prisma.telegramSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException('Источник не найден');
    return source;
  }

  async test(username: string) {
    return this.telegram.testChannel(username.replace(/^@/, ''));
  }

  async parseNow(id: string) {
    const source = await this.get(id);
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    try {
      const posts = await this.telegram.scrapePublicChannel(source.username, since);
      await this.prisma.telegramSource.update({
        where: { id },
        data: { lastParsed: new Date(), isActive: true },
      });
      return { ok: true, count: posts.length, sample: posts.slice(0, 3) };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}