import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import {
  classifyCategory,
  compressLocally,
  computeRelevanceScore,
  contentHash,
  deduplicateBySimilarity,
  extractTitle,
  formatNovosibirsk,
  isAdvertisement,
  isExpertPost,
  isValidPostLength,
  clampArticle,
  estimateTokens,
  detectTopic,
} from "../common/nlp.util";
import { CATEGORIES } from "../common/marvinbot.constants";

const DEFAULT_SOURCES = [
  { username: "openai", title: "OpenAI", category: "Инструменты ИИ", weight: 5 },
  { username: "ai_tools_daily", title: "AI Tools Daily", category: "Скилы и правила для Агентов", weight: 4 },
  { username: "chatgpt", title: "ChatGPT News", category: "Инструменты ИИ", weight: 3 },
  { username: "anthropic", title: "Anthropic", category: "Инструменты ИИ", weight: 5 },
  { username: "ai_business", title: "AI Business", category: "Монетизация с помощью ИИ", weight: 4 },
];

const EXPERTS = [
  "Andrej Karpathy",
  "Ilya Sutskever",
  "Yann LeCun",
  "Sam Altman",
  "Andrew Ng",
  "Simon Willison",
  "Lilian Weng",
  "Chip Huyen",
];

@Injectable()
export class DigestPipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeedSources() {
    for (const s of DEFAULT_SOURCES) {
      await this.prisma.telegramSource.upsert({
        where: { username: s.username },
        update: {},
        create: s,
      });
    }
  }

  listSources() {
    return this.prisma.telegramSource.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createSource(input: { username: string; title?: string; category: string; weight?: number }) {
    const username = input.username.replace(/^@/, "").trim().toLowerCase();
    if (!/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(username)) {
      throw new BadRequestException("Некорректный @username");
    }
    if (!CATEGORIES.includes(input.category as any)) {
      throw new BadRequestException(`Категория: ${CATEGORIES.join(", ")}`);
    }
    return this.prisma.telegramSource.create({
      data: {
        username,
        title: input.title || username,
        category: input.category,
        weight: Math.max(1, Math.min(5, input.weight ?? 3)),
        isActive: true,
      },
    });
  }

  async updateSource(
    id: string,
    data: Partial<{ title: string; category: string; weight: number; isActive: boolean }>,
  ) {
    await this.getSource(id);
    return this.prisma.telegramSource.update({ where: { id }, data });
  }

  async removeSource(id: string) {
    await this.getSource(id);
    await this.prisma.telegramSource.delete({ where: { id } });
    return { ok: true };
  }

  async getSource(id: string) {
    const s = await this.prisma.telegramSource.findUnique({ where: { id } });
    if (!s) throw new NotFoundException("Источник не найден");
    return s;
  }

  private demoPosts(username: string, category: string) {
    const now = Date.now();
    const samples: Record<string, string[]> = {
      "Инструменты ИИ": [
        `OpenAI выпустила обновление GPT API с tool calling. Benchmark MMLU вырос, latency −35%. https://openai.com`,
        `Ollama 0.5: локальные LLM-агенты с tool calling. Архитектура multi-agent стала проще.`,
        `Сравнение Claude 3.5 и GPT-4o для RAG: контекст vs скорость. Метрики внутри.`,
      ],
      "Скилы и правила для Агентов": [
        `Andrej Karpathy: best practices prompt-инжиниринга агентов — правила, memory, evals.`,
        `Simon Willison: skill-файлы для агентов как стандарт. Tool calling через JSON schema.`,
        `Как проектировать multi-agent: оркестратор, workers, shared memory. Paper на arxiv.org`,
      ],
      "Монетизация с помощью ИИ": [
        `Кейс: SaaS на LLM дал $12k MRR за квартал. Стратегия нишевого агента + подписка.`,
        `5 моделей pricing для AI-агентов: usage-based → enterprise.`,
      ],
      Прочее: [
        `Yann LeCun о world models и ограничениях LLM. Технические детали архитектуры.`,
        `Регулирование автономных агентов в ЕС: safety-метрики и paper.`,
      ],
    };
    const list = samples[category] || samples["Прочее"];
    return list.map((text, i) => ({
      text: `[${username}] ${text}`,
      author: text.includes("Karpathy") ? "Andrej Karpathy" : username,
      publishedAt: new Date(now - (i + 1) * 3600_000),
      views: 1000 + i * 400,
    }));
  }

  async runDigestCycle() {
    await this.ensureSeedSources();
    const sources = await this.prisma.telegramSource.findMany({ where: { isActive: true } });
    const keywords = ["агент", "LLM", "инструмент", "монетизация", "prompt", "RAG", "фреймворк"];
    const collected: Array<{
      sourceId: string;
      username: string;
      weight: number;
      category: string;
      text: string;
      author?: string;
      publishedAt: Date;
      views?: number;
    }> = [];

    for (const source of sources) {
      const posts = this.demoPosts(source.username, source.category);
      for (const p of posts) {
        if (!isValidPostLength(p.text) || isAdvertisement(p.text)) continue;
        collected.push({
          sourceId: source.id,
          username: source.username,
          weight: source.weight,
          category: source.category,
          text: p.text,
          author: p.author,
          publishedAt: p.publishedAt,
          views: p.views,
        });
      }
      await this.prisma.telegramSource.update({
        where: { id: source.id },
        data: { lastParsed: new Date() },
      });
    }

    const unique = deduplicateBySimilarity(collected, 0.85).slice(0, 50);
    const saved: Array<{ id: string; score: number }> = [];

    for (const item of unique) {
      const hash = contentHash(item.text);
      const exists = await this.prisma.parsedPost.findFirst({
        where: { contentHash: hash, sourceId: item.sourceId },
      });
      if (exists) {
        saved.push(exists);
        continue;
      }

      const category = classifyCategory(item.text, item.category as any);
      const isExpert = isExpertPost(item.text, item.author, EXPERTS);
      const score = computeRelevanceScore({
        text: item.text,
        publishedAt: item.publishedAt,
        keywords,
        channelWeight: item.weight,
        views: item.views,
      });
      const post = await this.prisma.parsedPost.create({
        data: {
          sourceId: item.sourceId,
          text: item.text,
          summary: compressLocally(item.text, 2),
          author: item.author,
          publishedAt: item.publishedAt,
          views: item.views,
          score,
          category,
          isExpert,
          contentHash: hash,
        },
      });
      saved.push(post);
    }

    // если новых постов нет — берём свежие из БД (повторный ручной запуск)
    let pool = saved;
    if (pool.length === 0) {
      pool = await this.prisma.parsedPost.findMany({
        orderBy: { score: "desc" },
        take: 20,
      });
    }

    const top = [...pool].sort((a, b) => b.score - a.score).slice(0, 10);
    const digest = await this.prisma.digest.create({
      data: {
        status: "sent",
        messageId: `local-${Date.now()}`,
        items: {
          create: top.map((p, i) => ({ postId: p.id, order: i + 1, selected: false })),
        },
      },
      include: {
        items: { include: { post: { include: { source: true } } }, orderBy: { order: "asc" } },
      },
    });

    await this.prisma.marvinAuditLog.create({
      data: {
        action: "digest.generated",
        detail: JSON.stringify({ digestId: digest.id, posts: top.length, at: formatNovosibirsk() }),
        tokens: 0,
      },
    });

    return digest;
  }

  listDigests() {
    return this.prisma.digest.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: true },
    });
  }

  async getDigest(id: string) {
    const digest = await this.prisma.digest.findUnique({
      where: { id },
      include: {
        items: { include: { post: { include: { source: true } } }, orderBy: { order: "asc" } },
      },
    });
    if (!digest) throw new NotFoundException("Дайджест не найден");
    return digest;
  }

  async selectItems(digestId: string, itemIds: string[]) {
    await this.getDigest(digestId);
    await this.prisma.digestItem.updateMany({ where: { digestId }, data: { selected: false } });
    if (itemIds.length) {
      await this.prisma.digestItem.updateMany({
        where: { digestId, id: { in: itemIds } },
        data: { selected: true },
      });
    }
    return this.getDigest(digestId);
  }

  async approveAndGenerate(digestId: string) {
    const digest = await this.getDigest(digestId);
    const selected = digest.items.filter((i) => i.selected);
    if (selected.length < 2) throw new BadRequestException("Выберите минимум 2 поста");
    if (selected.length > 5) throw new BadRequestException("Максимум 5 постов на статью");

    const topic = detectTopic(selected.map((i) => i.post.category));
    const trends = selected.map((i) => {
      const s = compressLocally(i.post.summary || i.post.text, 1);
      return `<li>📌 ${escapeHtml(s)}${i.post.isExpert ? " 🟣 #expert" : ""}</li>`;
    });
    const sources = selected.map((i, idx) => {
      const src = i.post.source.username;
      return `<li>${idx + 1}. @${src} — ${escapeHtml(compressLocally(i.post.text, 1).slice(0, 120))}</li>`;
    });
    const expert = selected.some((i) => i.post.isExpert)
      ? `<p>🟣 #expert В выборке есть экспертные материалы — опирайтесь на факты.</p>`
      : "";

    let content = `<h2>Введение</h2>
<p>Тема «${escapeHtml(topic)}» снова в центре внимания: сигналы из Telegram стоит перевести в рабочие решения.</p>
${expert}
<h2>Ключевые тренды</h2>
<ul>${trends.join("")}</ul>
<h2>Практические рекомендации</h2>
<ul>
<li>🚀 Зафиксируйте 1–2 гипотезы и проверьте на своём пайплайне.</li>
<li>💡 Соберите короткий playbook (правила + промпты).</li>
<li>⚡ Ограничьте эксперименты метриками: latency, качество, токены.</li>
</ul>
<h2>Инструменты и ресурсы</h2>
<ul><li>Документация LLM/агентных фреймворков из выбранных постов</li></ul>
<h2>Заключение</h2>
<p>Выберите 2–3 изменения с измеримым эффектом и сравните с baseline.</p>
<h2>Источники</h2>
<ul>${sources.join("")}</ul>`;

    content = clampArticle(content, 2500);
    const tokensUsed = estimateTokens(content);

    const article = await this.prisma.marvinArticle.create({
      data: {
        title: `Обзор: ${topic}`,
        content,
        query: `digest:${digestId}`,
        tags: [topic, "дайджест", "telegram"],
        status: "draft",
        tokenUsed: tokensUsed,
      },
    });

    await this.prisma.digest.update({
      where: { id: digestId },
      data: { status: "generated", articleId: article.id },
    });

    await this.prisma.marvinAuditLog.create({
      data: {
        action: "article.from_digest",
        detail: JSON.stringify({ digestId, articleId: article.id, tokensUsed }),
        tokens: tokensUsed,
      },
    });

    return article;
  }

  async stats() {
    const weekAgo = new Date(Date.now() - 7 * 86400_000);
    const [articlesWeek, sourcesActive, digestsTotal, tokenRows] = await Promise.all([
      this.prisma.marvinArticle.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.telegramSource.count({ where: { isActive: true } }),
      this.prisma.digest.count(),
      this.prisma.marvinAuditLog.findMany({
        where: { createdAt: { gte: weekAgo }, tokens: { gt: 0 } },
      }),
    ]);
    const tokensWeek = tokenRows.reduce((a, r) => a + r.tokens, 0);
    return { articlesWeek, sourcesActive, digestsTotal, tokensWeek };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}