import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { MarvinbotService } from '../marvinbot/marvinbot.service';
import { LoggerService } from '../../common/logger/logger.service';
import { DEFAULTS } from '../../common/constants/marvinbot.constants';
import {
  classifyCategory,
  computeRelevanceScore,
  contentHash,
  deduplicateBySimilarity,
  extractTitle,
  formatNovosibirsk,
  isAdvertisement,
  isExpertPost,
  isValidPostLength,
} from '../../common/utils/nlp.util';

@Injectable()
export class DigestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegram: TelegramService,
    private readonly marvinbot: MarvinbotService,
    private readonly appLogger: LoggerService,
  ) {}

  /** Полный цикл: сбор → классификация → дайджест → отправка */
  async runDigestCycle(options?: { manual?: boolean }) {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const demoMode = this.config.get('DEMO_MODE') === 'true';
    const maxDigest = Number(this.config.get('MAX_POSTS_PER_DIGEST') || DEFAULTS.maxPostsPerDigest);

    const settings = await this.getSettings();
    const keywords: string[] = settings.keywords ? JSON.parse(settings.keywords) : [];
    const experts = await this.prisma.expert.findMany({ where: { isActive: true } });
    const expertNames = experts.map((e) => e.name);

    const sources = await this.prisma.telegramSource.findMany({ where: { isActive: true } });
    const collected: Array<{
      sourceId: string;
      username: string;
      weight: number;
      category: string;
      text: string;
      author?: string;
      publishedAt: Date;
      views?: number;
      forwards?: number;
      reactions?: number;
    }> = [];

    for (const source of sources) {
      try {
        let posts =
          demoMode
            ? this.telegram.generateDemoPosts(source.username, source.category, 3)
            : await this.telegram.scrapePublicChannel(source.username, since);

        if (!demoMode && posts.length === 0) {
          // фоллбек на demo-фрагмент только для ручного теста, если канал пуст
          if (options?.manual) {
            posts = this.telegram.generateDemoPosts(source.username, source.category, 2);
          }
        }

        for (const p of posts) {
          if (!isValidPostLength(p.text)) continue;
          if (isAdvertisement(p.text)) continue;
          collected.push({
            sourceId: source.id,
            username: source.username,
            weight: source.weight,
            category: source.category,
            text: p.text,
            author: p.author,
            publishedAt: p.publishedAt,
            views: p.views,
            forwards: p.forwards,
            reactions: p.reactions,
          });
        }

        await this.prisma.telegramSource.update({
          where: { id: source.id },
          data: { lastParsed: new Date() },
        });
      } catch (e: any) {
        this.appLogger.error(`Ошибка парсинга @${source.username}`, { error: e.message });
        // приватный/недоступный — деактивируем и уведомляем
        if (/private|404|недоступ/i.test(e.message)) {
          await this.prisma.telegramSource.update({
            where: { id: source.id },
            data: { isActive: false },
          });
          const chatId = settings.telegramChatId || this.config.get('TELEGRAM_CHAT_ID');
          if (chatId) {
            await this.telegram.sendMessage(
              chatId,
              `⚠️ Канал @${source.username} недоступен и отключён.`,
            );
          }
        }
      }
    }

    // Лимит 50 постов за цикл
    let unique = deduplicateBySimilarity(collected, DEFAULTS.duplicateSimilarity).slice(0, 50);

    const savedPosts: Array<{
      id: string;
      score: number;
      text: string;
      summary: string | null;
      category: string;
      isExpert: boolean;
      author: string | null;
    }> = [];
    for (const item of unique) {
      const hash = contentHash(item.text);
      const existing = await this.prisma.parsedPost.findFirst({
        where: { contentHash: hash, sourceId: item.sourceId },
      });
      if (existing) continue;

      const category = classifyCategory(item.text, item.category as any);
      const isExpert = isExpertPost(item.text, item.author, expertNames);
      const score = computeRelevanceScore({
        text: item.text,
        publishedAt: item.publishedAt,
        keywords,
        channelWeight: item.weight,
        views: item.views,
        forwards: item.forwards,
        reactions: item.reactions,
      });

      const { summary } = await this.marvinbot.compressPost(item.text);

      const post = await this.prisma.parsedPost.create({
        data: {
          sourceId: item.sourceId,
          text: item.text,
          summary,
          author: item.author,
          publishedAt: item.publishedAt,
          views: item.views,
          forwards: item.forwards,
          reactions: item.reactions,
          score,
          category,
          isExpert,
          contentHash: hash,
        },
      });
      savedPosts.push(post);
    }

    const top = savedPosts.sort((a, b) => b.score - a.score).slice(0, maxDigest);

    const digest = await this.prisma.digest.create({
      data: {
        status: 'draft',
        items: {
          create: top.map((p, index) => ({
            postId: p.id,
            order: index + 1,
            selected: false,
          })),
        },
      },
      include: {
        items: { include: { post: { include: { source: true } } }, orderBy: { order: 'asc' } },
      },
    });

    await this.sendDigestMessage(digest.id);
    await this.appLogger.audit('digest.generated', 'Digest', digest.id, {
      posts: top.length,
      channels: sources.length,
      manual: !!options?.manual,
    });

    return this.getDigest(digest.id);
  }

  async sendDigestMessage(digestId: string) {
    const digest = await this.getDigest(digestId);
    const settings = await this.getSettings();
    const chatId = settings.telegramChatId || this.config.get('TELEGRAM_CHAT_ID') || 'local';
    const text = this.formatDigestMessage(digest);
    const keyboard = this.buildKeyboard(digest.items);

    const messageId = await this.telegram.sendMessage(chatId, text, keyboard);
    await this.prisma.digest.update({
      where: { id: digestId },
      data: { status: 'sent', messageId: messageId || undefined },
    });
  }

  formatDigestMessage(digest: any): string {
    const dateLabel = formatNovosibirsk(digest.date);
    const channels = new Set(digest.items.map((i: any) => i.post.source.username));
    const lines = [
      `📊 Дайджест за ${dateLabel}`,
      '',
      `Найдено ${digest.items.length} постов из ${channels.size} каналов. Выберите для статьи:`,
      '',
    ];

    for (const item of digest.items) {
      const mark = item.selected ? '✅' : '⬜';
      const title = extractTitle(item.post.summary || item.post.text);
      const expert = item.post.isExpert ? '\n🏷️ 🟣 #expert' : '';
      lines.push(
        `${mark} [${item.order}] ${title}`,
        `📌 ${item.post.category} | @${item.post.source.username}`,
        `📝 ${item.post.summary || compressFallback(item.post.text)}`,
        expert,
        '',
      );
    }

    lines.push('Нажмите ✅ для добавления, ❌ для пропуска.');
    lines.push('После выбора нажмите 🚀 Сгенерировать статью');
    return lines.filter((l) => l !== null).join('\n');
  }

  buildKeyboard(items: any[]) {
    return {
      inline_keyboard: [
        ...items.map((item) => [
          {
            text: `${item.selected ? '✅' : '⬜'} ${item.order}. ${(item.post.summary || item.post.text).slice(0, 40)}…`,
            callback_data: `toggle_${item.id}`,
          },
        ]),
        [
          { text: '🚀 Сгенерировать статью', callback_data: 'generate_article' },
          { text: '❌ Отмена', callback_data: 'cancel' },
        ],
      ],
    };
  }

  async toggleItem(itemId: string, chatId: string, messageId: string) {
    const item = await this.prisma.digestItem.findUnique({
      where: { id: itemId },
      include: { digest: true },
    });
    if (!item) return;

    const selectedCount = await this.prisma.digestItem.count({
      where: { digestId: item.digestId, selected: true },
    });
    const maxPosts = Number(this.config.get('MAX_POSTS_PER_ARTICLE') || 5);

    if (!item.selected && selectedCount >= maxPosts) {
      await this.telegram.sendMessage(
        chatId,
        `⚠️ Лимит ${maxPosts} постов на статью. Снимите лишние, чтобы не превысить бюджет токенов.`,
      );
      return;
    }

    await this.prisma.digestItem.update({
      where: { id: itemId },
      data: { selected: !item.selected },
    });

    const digest = await this.getDigest(item.digestId);
    const text = this.formatDigestMessage(digest);
    await this.telegram.editMessage(chatId, messageId, text, this.buildKeyboard(digest.items));
  }

  async generateFromTelegram(chatId: string, messageId: string) {
    const digest = await this.prisma.digest.findFirst({
      where: { messageId, status: { in: ['sent', 'draft', 'approved'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { post: { include: { source: true } } }, orderBy: { order: 'asc' } },
      },
    });

    if (!digest) {
      // поиск последнего отправленного
      const last = await this.prisma.digest.findFirst({
        where: { status: 'sent' },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { post: { include: { source: true } } }, orderBy: { order: 'asc' } },
        },
      });
      if (!last) {
        await this.telegram.sendMessage(chatId, 'Дайджест не найден.');
        return;
      }
      return this.approveAndGenerate(last.id, chatId);
    }

    return this.approveAndGenerate(digest.id, chatId);
  }

  async approveAndGenerate(digestId: string, chatId?: string) {
    const digest = await this.getDigest(digestId);
    const selected = digest.items.filter((i) => i.selected);
    if (selected.length < 2) {
      const msg = 'Выберите минимум 2 поста для генерации статьи.';
      if (chatId) await this.telegram.sendMessage(chatId, msg);
      throw new BadRequestException(msg);
    }

    const maxPosts = Number(this.config.get('MAX_POSTS_PER_ARTICLE') || 5);
    if (selected.length > maxPosts) {
      const msg = `Выбрано ${selected.length} постов. Максимум ${maxPosts} — уберите лишние.`;
      if (chatId) await this.telegram.sendMessage(chatId, msg);
      throw new BadRequestException(msg);
    }

    await this.prisma.digest.update({ where: { id: digestId }, data: { status: 'approved' } });

    try {
      const result = await this.marvinbot.generateArticle({
        digestId,
        posts: selected.map((i) => ({
          text: i.post.text,
          summary: i.post.summary,
          category: i.post.category,
          isExpert: i.post.isExpert,
          author: i.post.author,
          sourceUsername: i.post.source.username,
        })),
      });

      const article = await this.prisma.article.upsert({
        where: { digestId },
        update: {
          title: result.title,
          content: result.content,
          tokensUsed: result.tokensUsed,
          status: 'draft',
        },
        create: {
          digestId,
          title: result.title,
          content: result.content,
          tokensUsed: result.tokensUsed,
          status: 'draft',
        },
      });

      await this.prisma.digest.update({ where: { id: digestId }, data: { status: 'generated' } });
      await this.prisma.parsedPost.updateMany({
        where: { id: { in: selected.map((i) => i.postId) } },
        data: { isProcessed: true },
      });

      const targetChat =
        chatId ||
        (await this.getSettings()).telegramChatId ||
        this.config.get('TELEGRAM_CHAT_ID');

      if (targetChat) {
        const preview =
          `✅ Статья готова (${result.tokensUsed} токенов, ${result.content.length} символов)\n\n` +
          `<b>${article.title}</b>\n\n` +
          result.content.slice(0, 3500);
        await this.telegram.sendMessage(targetChat, preview);
      }

      await this.appLogger.audit('article.generated', 'Article', article.id, {
        tokensUsed: result.tokensUsed,
        model: result.model,
      });

      return article;
    } catch (e: any) {
      // сохранить черновик ошибки
      const draft = await this.prisma.article.upsert({
        where: { digestId },
        update: {
          title: 'Черновик (ошибка генерации)',
          content: `Ошибка генерации: ${e.message}`,
          tokensUsed: 0,
          status: 'draft',
        },
        create: {
          digestId,
          title: 'Черновик (ошибка генерации)',
          content: `Ошибка генерации: ${e.message}`,
          tokensUsed: 0,
          status: 'draft',
        },
      });
      if (chatId) {
        await this.telegram.sendMessage(chatId, `❌ Ошибка генерации. Черновик сохранён: ${draft.id}`);
      }
      throw e;
    }
  }

  async cancelDigest(chatId: string, messageId: string) {
    const digest = await this.prisma.digest.findFirst({
      where: { messageId },
      orderBy: { createdAt: 'desc' },
    });
    if (digest) {
      await this.prisma.digest.update({ where: { id: digest.id }, data: { status: 'rejected' } });
    }
    await this.telegram.sendMessage(chatId, 'Дайджест отменён.');
  }

  async listDigests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.digest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          article: { select: { id: true, title: true, status: true, tokensUsed: true } },
        },
      }),
      this.prisma.digest.count(),
    ]);
    return { items, total, page, limit };
  }

  async getDigest(id: string) {
    const digest = await this.prisma.digest.findUnique({
      where: { id },
      include: {
        items: {
          include: { post: { include: { source: true } } },
          orderBy: { order: 'asc' },
        },
        article: true,
      },
    });
    if (!digest) throw new NotFoundException('Дайджест не найден');
    return digest;
  }

  async selectItems(digestId: string, itemIds: string[]) {
    await this.getDigest(digestId);
    await this.prisma.digestItem.updateMany({
      where: { digestId },
      data: { selected: false },
    });
    if (itemIds.length) {
      await this.prisma.digestItem.updateMany({
        where: { digestId, id: { in: itemIds } },
        data: { selected: true },
      });
    }
    return this.getDigest(digestId);
  }

  /** Напоминание через 2 часа, если нет ответа */
  async sendReminders() {
    const hours = Number(this.config.get('CRON_REMINDER_HOURS') || 2);
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
    const pending = await this.prisma.digest.findMany({
      where: {
        status: 'sent',
        reminderSentAt: null,
        createdAt: { lte: threshold },
      },
    });
    const settings = await this.getSettings();
    const chatId = settings.telegramChatId || this.config.get('TELEGRAM_CHAT_ID');
    for (const d of pending) {
      if (chatId) {
        await this.telegram.sendMessage(
          chatId,
          `⏰ Напоминание: дайджест от ${formatNovosibirsk(d.date)} ждёт вашего выбора.`,
        );
      }
      await this.prisma.digest.update({
        where: { id: d.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  /** Очистка старых дайджестов (> 30 дней) */
  async cleanupOldDigests() {
    const days = Number(this.config.get('DIGEST_RETENTION_DAYS') || DEFAULTS.digestRetentionDays);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.prisma.digest.deleteMany({ where: { createdAt: { lt: cutoff } } });
    this.appLogger.info(`Удалено старых дайджестов: ${result.count}`);
  }

  private async getSettings() {
    const userId = this.config.get('DEFAULT_USER_ID') || 'default-user';
    let settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          keywords: JSON.stringify(['агент', 'LLM', 'инструмент', 'монетизация']),
          telegramChatId: this.config.get('TELEGRAM_CHAT_ID') || '',
        },
      });
    }
    return settings;
  }
}

function compressFallback(text: string) {
  return text.slice(0, 160) + (text.length > 160 ? '…' : '');
}