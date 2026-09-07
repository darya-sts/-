import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoggerService } from '../../common/logger/logger.service';
import { normalizeText } from '../../common/utils/nlp.util';

export interface ScrapedPost {
  text: string;
  author?: string;
  publishedAt: Date;
  views?: number;
  forwards?: number;
  reactions?: number;
  url?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private requestTimestamps: number[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly appLogger: LoggerService,
  ) {}

  /** Rate limit: не более N запросов/час к Telegram */
  private assertRateLimit() {
    const limit = Number(this.config.get('TELEGRAM_RATE_LIMIT_PER_HOUR') || 100);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > hourAgo);
    if (this.requestTimestamps.length >= limit) {
      throw new Error(`Превышен rate limit Telegram API (${limit}/час)`);
    }
    this.requestTimestamps.push(Date.now());
  }

  /** Проверка доступности публичного канала */
  async testChannel(username: string): Promise<{ ok: boolean; title?: string; error?: string }> {
    const clean = username.replace(/^@/, '').trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(clean)) {
      return { ok: false, error: 'Некорректный @username публичного канала' };
    }
    try {
      this.assertRateLimit();
      const res = await axios.get(`https://t.me/s/${clean}`, {
        timeout: 10000,
        headers: { 'User-Agent': 'MarvinBotStudio/1.0' },
        validateStatus: (s) => s < 500,
      });
      if (res.status === 404) return { ok: false, error: 'Канал не найден или приватный' };
      const $ = cheerio.load(res.data);
      const title =
        $('.tgme_channel_info_header_title').text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        clean;
      const hasPosts = $('.tgme_widget_message').length > 0;
      if (!hasPosts && res.status !== 200) {
        return { ok: false, error: 'Канал недоступен через публичный API' };
      }
      return { ok: true, title };
    } catch (e: any) {
      this.appLogger.error(`testChannel ${clean}: ${e.message}`);
      return { ok: false, error: e.message };
    }
  }

  /** Парсинг публичного канала через t.me/s (бесплатно, без Telethon) */
  async scrapePublicChannel(username: string, since: Date): Promise<ScrapedPost[]> {
    const clean = username.replace(/^@/, '');
    const cacheKey = `scrape:${clean}:${since.toISOString().slice(0, 13)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached).map((p: any) => ({ ...p, publishedAt: new Date(p.publishedAt) }));

    // Сначала пробуем Telethon worker (если доступен)
    const telethonPosts = await this.tryTelethon(clean, since);
    if (telethonPosts) {
      await this.redis.set(cacheKey, JSON.stringify(telethonPosts), 3600);
      return telethonPosts;
    }

    this.assertRateLimit();
    const url = `https://t.me/s/${clean}`;
    try {
      const res = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'MarvinBotStudio/1.0' },
      });
      const $ = cheerio.load(res.data);
      const posts: ScrapedPost[] = [];

      $('.tgme_widget_message').each((_, el) => {
        const text = normalizeText($(el).find('.tgme_widget_message_text').text());
        const datetime = $(el).find('time').attr('datetime');
        const viewsText = $(el).find('.tgme_widget_message_views').text().trim();
        const publishedAt = datetime ? new Date(datetime) : new Date();
        if (publishedAt < since) return;
        if (!text) return;
        posts.push({
          text,
          publishedAt,
          views: parseViews(viewsText),
          author: clean,
          url: $(el).find('a.tgme_widget_message_date').attr('href'),
        });
      });

      await this.redis.set(cacheKey, JSON.stringify(posts), 3600);
      return posts;
    } catch (e: any) {
      this.appLogger.error(`scrapePublicChannel ${clean}`, { error: e.message });
      throw e;
    }
  }

  /** Demo-посты для теста без Telegram */
  generateDemoPosts(username: string, category: string, count = 4): ScrapedPost[] {
    const now = Date.now();
    const samples: Record<string, string[]> = {
      'Инструменты ИИ': [
        `OpenAI выпустила обновление GPT API с улучшенным tool calling и сниженной latency на 35%. Benchmark на MMLU показал рост качества. Подробности: https://openai.com`,
        `Новый релиз Ollama 0.5 поддерживает локальный запуск LLM-агентов с tool calling. Архитектура multi-agent стала проще для разработчиков.`,
        `Сравнение Claude 3.5 и GPT-4o для RAG: Claude лучше держит длинный контекст, GPT быстрее на коротких запросах. Метрики внутри.`,
        `LangChain добавил новый framework для агентов с правилами и skills. Tutorial по настройке за 15 минут.`,
      ],
      'Скилы и правила для Агентов': [
        `Andrej Karpathy описал best practices для prompt-инжиниринга агентов: чёткие правила, memory, evals. Архитектура из 5 слоёв.`,
        `Как проектировать multi-agent систему: оркестратор, workers, shared memory. Пример кода и paper на arxiv.org`,
        `Simon Willison: skill-файлы для агентов — новый стандарт. Правила в markdown, tool calling через JSON schema.`,
        `RAG vs агенты с инструментами: когда что выбирать. Benchmark latency и качество ответов.`,
      ],
      'Монетизация с помощью ИИ': [
        `Кейс: SaaS на базе LLM принёс $12k MRR за 3 месяца. Стратегия: нишевый агент + подписка. Конкретные шаги запуска.`,
        `Монетизация AI-агентов для бизнеса: 5 моделей pricing. От usage-based до enterprise лицензий.`,
        `Как заработать на автоматизации контента с помощью ИИ: фриланс-пайплайн и готовые шаблоны промптов.`,
        `AI Business: стартап использует Claude для клиентского саппорта и сократил costs на 40%.`,
      ],
      Прочее: [
        `Исследование этики автономных агентов: регулирование в ЕС и новые safety-метрики. Paper опубликован.`,
        `Обзор рынка ИИ за неделю: инвестиции, регулирование, открытые модели.`,
        `Yann LeCun прокомментировал ограничения LLM и путь к world models. Технические детали архитектуры.`,
        `Новые требования к прозрачности AI-систем в корпорациях: чек-лист для команд.`,
      ],
    };
    const list = samples[category] || samples['Прочее'];
    return list.slice(0, count).map((text, i) => ({
      text: `[${username}] ${text}`,
      author: i === 0 && text.includes('Karpathy') ? 'Andrej Karpathy' : username,
      publishedAt: new Date(now - (i + 1) * 60 * 60 * 1000),
      views: 1000 + i * 500,
      forwards: 10 + i * 3,
      reactions: 20 + i * 5,
    }));
  }

  private async tryTelethon(username: string, since: Date): Promise<ScrapedPost[] | null> {
    const worker = this.config.get('TELETHON_URL') || 'http://telethon:8001';
    try {
      const res = await axios.post(
        `${worker}/scrape`,
        { username, since: since.toISOString() },
        { timeout: 5000 },
      );
      if (Array.isArray(res.data?.posts)) {
        return res.data.posts.map((p: any) => ({
          ...p,
          publishedAt: new Date(p.publishedAt),
        }));
      }
    } catch {
      // Telethon опционален
    }
    return null;
  }

  /** Отправка сообщения в Telegram Bot API */
  async sendMessage(
    chatId: string,
    text: string,
    replyMarkup?: Record<string, unknown>,
  ): Promise<string | null> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || !chatId) {
      this.logger.warn('TELEGRAM_BOT_TOKEN или chatId не заданы — сообщение только в лог');
      this.appLogger.info('TELEGRAM_OUTBOX', { chatId, text: text.slice(0, 500) });
      await this.redis.set(`outbox:${Date.now()}`, JSON.stringify({ chatId, text, replyMarkup }), 86400);
      return `local-${Date.now()}`;
    }
    this.assertRateLimit();
    try {
      const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        disable_web_page_preview: true,
      });
      return String(res.data?.result?.message_id ?? null);
    } catch (e: any) {
      this.appLogger.error('sendMessage failed', { error: e.message });
      return null;
    }
  }

  async editMessage(
    chatId: string,
    messageId: string,
    text: string,
    replyMarkup?: Record<string, unknown>,
  ): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || messageId.startsWith('local-')) {
      await this.redis.set(
        `outbox-edit:${messageId}`,
        JSON.stringify({ chatId, text, replyMarkup }),
        86400,
      );
      return;
    }
    this.assertRateLimit();
    try {
      await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
        chat_id: chatId,
        message_id: Number(messageId),
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        disable_web_page_preview: true,
      });
    } catch (e: any) {
      this.appLogger.error('editMessage failed', { error: e.message });
    }
  }

  async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;
    try {
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text,
      });
    } catch {
      /* ignore */
    }
  }
}

function parseViews(raw: string): number | undefined {
  if (!raw) return undefined;
  const t = raw.toLowerCase().replace(/\s/g, '');
  if (t.endsWith('k')) return Math.round(parseFloat(t) * 1000);
  if (t.endsWith('m')) return Math.round(parseFloat(t) * 1_000_000);
  const n = parseInt(t.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}