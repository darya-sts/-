import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoggerService } from '../../common/logger/logger.service';
import {
  ARTICLE_PROMPT_TEMPLATE,
  COMPRESS_PROMPT,
  DEFAULTS,
} from '../../common/constants/marvinbot.constants';
import {
  clampArticle,
  compressLocally,
  detectTopic,
  estimateTokens,
  normalizeText,
  stripStopWords,
} from '../../common/utils/nlp.util';

export interface GenerateArticleInput {
  posts: Array<{
    text: string;
    summary?: string | null;
    category: string;
    isExpert: boolean;
    author?: string | null;
    sourceUsername?: string;
  }>;
  digestId: string;
}

export interface GenerateArticleResult {
  title: string;
  content: string;
  tokensUsed: number;
  model: string;
}

@Injectable()
export class MarvinbotService {
  private readonly logger = new Logger(MarvinbotService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly appLogger: LoggerService,
  ) {}

  /** Сжатие поста (кэш + локальный фоллбек) */
  async compressPost(text: string): Promise<{ summary: string; tokens: number }> {
    const key = `compress:${Buffer.from(normalizeText(text)).toString('base64').slice(0, 64)}`;
    const cached = await this.redis.get(key);
    if (cached) return { summary: cached, tokens: 0 };

    const cleaned = stripStopWords(normalizeText(text)).slice(0, 1200);
    let summary = compressLocally(cleaned);
    let tokens = 0;

    const forceLocal = this.config.get('MARVINBOT_FORCE_LOCAL') === 'true';
    if (!forceLocal) {
      try {
        const prompt = COMPRESS_PROMPT.replace('{text}', cleaned);
        const result = await this.callLlm(prompt, 120);
        if (result.text) {
          summary = compressLocally(result.text, 2);
          tokens = result.tokens;
        }
      } catch (e: any) {
        this.logger.warn(`compress fallback local: ${e.message}`);
      }
    }

    await this.redis.set(key, summary, 86400);
    if (tokens > 0) {
      await this.trackTokens('compress', tokens);
    }
    return { summary, tokens };
  }

  async generateArticle(input: GenerateArticleInput): Promise<GenerateArticleResult> {
    const maxPosts = Number(this.config.get('MAX_POSTS_PER_ARTICLE') || DEFAULTS.maxPostsPerArticle);
    const maxChars = Number(this.config.get('MAX_ARTICLE_CHARS') || DEFAULTS.maxArticleChars);
    const maxTokens = Number(this.config.get('MAX_ARTICLE_TOKENS') || DEFAULTS.maxArticleTokens);

    let posts = input.posts.slice(0, maxPosts);
    if (posts.length > 3) {
      // экономия токенов: при риске лимита оставляем топ-3
      const rough = estimateTokens(posts.map((p) => p.summary || p.text).join('\n'));
      if (rough > maxTokens * 0.6) posts = posts.slice(0, 3);
    }

    const topic = detectTopic(posts.map((p) => p.category));
    const selected = posts
      .map((p, i) => {
        const body = compressLocally(p.summary || p.text, 2);
        const expert = p.isExpert ? ' 🟣 #expert' : '';
        const src = p.sourceUsername ? `@${p.sourceUsername}` : '';
        return `${i + 1}. [${p.category}]${expert} ${src}\n${body}`;
      })
      .join('\n\n');

    const prompt = ARTICLE_PROMPT_TEMPLATE.replace('{topic}', topic).replace(
      '{selected_posts}',
      selected,
    );

    let content = '';
    let tokensUsed = estimateTokens(prompt);
    let model = 'local-fallback';

    const forceLocal = this.config.get('MARVINBOT_FORCE_LOCAL') === 'true';
    if (!forceLocal) {
      try {
        const result = await this.callLlm(prompt, maxTokens);
        if (result.text && result.text.length > 400) {
          content = result.text;
          tokensUsed = result.tokens;
          model = result.model;
        }
      } catch (e: any) {
        this.logger.warn(`MarvinBot timeout/fallback: ${e.message}`);
        this.appLogger.warn('MarvinBot недоступен, локальная генерация', { error: e.message });
      }
    }

    if (!content) {
      content = this.buildLocalArticle(topic, posts);
      tokensUsed = estimateTokens(prompt + content);
      model = 'local-fallback';
    }

    content = clampArticle(content, maxChars);
    // жёсткий лимит символов
    if (content.length > maxChars) content = content.slice(0, maxChars);

    const title = this.extractTitleFromArticle(content, topic);
    await this.trackTokens('article', tokensUsed, model, { digestId: input.digestId });

    return { title, content, tokensUsed, model };
  }

  /** Локальный качественный генератор статьи (без платных API) */
  buildLocalArticle(
    topic: string,
    posts: GenerateArticleInput['posts'],
  ): string {
    const trends = posts.map((p) => {
      const s = compressLocally(p.summary || p.text, 1);
      return `- 📌 ${s}${p.isExpert ? ' 🟣 #expert' : ''}`;
    });

    const practices = [
      '- 🚀 Зафиксируйте 1–2 гипотезы из трендов и проверьте на своём пайплайне в течение недели.',
      '- 💡 Выделите повторяющиеся инструменты и соберите короткий внутренний playbook (правила + промпты).',
      '- ⚡ Ограничьте эксперименты метриками: latency, качество ответа, стоимость токенов.',
    ];

    const tools = posts
      .flatMap((p) => {
        const links = (p.text.match(/https?:\/\/[^\s)]+/g) || []).slice(0, 2);
        return links.map((l) => `- ${l}`);
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6);

    if (tools.length === 0) {
      tools.push('- Документация используемых LLM/агентных фреймворков из выбранных постов');
    }

    const sources = posts.map((p, i) => {
      const src = p.sourceUsername ? `@${p.sourceUsername}` : p.author || 'источник';
      return `${i + 1}. ${src} — ${compressLocally(p.text, 1).slice(0, 120)}`;
    });

    const expertBlock = posts.some((p) => p.isExpert)
      ? '\n\n🟣 #expert В выборке есть экспертные/технические материалы — опирайтесь на факты и первоисточники, а не на пересказ.'
      : '';

    const draft = `## Введение
Тема «${topic}» снова в центре внимания: за последние часы в Telegram появились сигналы, которые стоит перевести в рабочие решения. Ниже — сжатый разбор без воды, только то, что можно применить.${expertBlock}

## Ключевые тренды
${trends.join('\n')}

## Практические рекомендации
${practices.join('\n')}

## Инструменты и ресурсы
${tools.join('\n')}

## Заключение
Главное — не собирать бесконечный поток новостей, а выбирать 2–3 изменения с измеримым эффектом. Следующий шаг: внедрить один эксперимент и сравнить результат с текущим baseline.

## Источники
${sources.join('\n')}`;

    return clampArticle(draft, Number(this.config.get('MAX_ARTICLE_CHARS') || 2500));
  }

  private extractTitleFromArticle(content: string, topic: string): string {
    const m = content.match(/^#\s+(.+)$/m);
    if (m) return m[1].trim().slice(0, 120);
    return `Обзор: ${topic}`;
  }

  private async callLlm(
    prompt: string,
    maxTokens: number,
  ): Promise<{ text: string; tokens: number; model: string }> {
    const baseUrl = this.config.get('MARVINBOT_URL') || '';
    const apiKey = this.config.get('MARVINBOT_API_KEY') || 'ollama';
    const model = this.config.get('MARVINBOT_MODEL') || 'llama3.2';
    const timeout = Number(this.config.get('MARVINBOT_TIMEOUT_MS') || 10000);

    if (!baseUrl) throw new Error('MARVINBOT_URL не задан');

    const res = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: 'Ты MarvinBot — краткий эксперт по ИИ. Отвечай только по делу.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.4,
      },
      {
        timeout,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const text = res.data?.choices?.[0]?.message?.content || '';
    const tokens =
      res.data?.usage?.total_tokens || estimateTokens(prompt) + estimateTokens(text);
    return { text, tokens, model };
  }

  private async trackTokens(operation: string, tokens: number, model?: string, meta?: unknown) {
    try {
      await this.prisma.tokenUsage.create({
        data: {
          operation,
          tokens,
          model,
          meta: meta ? JSON.stringify(meta) : null,
        },
      });
    } catch (e: any) {
      this.logger.warn(`token track failed: ${e.message}`);
    }
  }
}