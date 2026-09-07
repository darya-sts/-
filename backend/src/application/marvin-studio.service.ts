import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import { RedisService } from "../infrastructure/redis/redis.service";
import { MarvinBotClient } from "../infrastructure/marvin/marvinbot.client";
import { exportDocx, exportPdf } from "../infrastructure/export/export.service";

@Injectable()
export class MarvinStudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly marvin: MarvinBotClient,
  ) {}

  async listArticles() {
    return this.prisma.marvinArticle.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getArticle(id: string) {
    const article = await this.prisma.marvinArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException("Article not found");
    return article;
  }

  async getSettings() {
    const row = await this.prisma.marvinSettings.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!row) throw new NotFoundException("Settings not found");
    return row;
  }

  async updateSkills(input: { skills?: string; rules?: string; telegramSources?: string }) {
    const current = await this.getSettings();
    return this.prisma.marvinSettings.update({
      where: { id: current.id },
      data: {
        skills: input.skills ?? current.skills,
        rules: input.rules ?? current.rules,
        telegramSources: input.telegramSources ?? current.telegramSources,
      },
    });
  }

  async generate(input: { query: string; context?: string; clientKey: string }) {
    if (!input.query?.trim()) throw new BadRequestException("query is required");
    const limited = await this.redis.hitRateLimit(input.clientKey, 10, 60);
    if (limited) throw new BadRequestException("Rate limit: 10 requests/min");

    const cacheKey = this.redis.cacheKey(input.query, input.context);
    const cached = await this.redis.getJson<{
      title: string;
      contentHtml: string;
      tags: string[];
      tokenUsed: number;
    }>(cacheKey);

    const settings = await this.getSettings();
    const result = cached
      ? {
          title: cached.title,
          contentHtml: cached.contentHtml,
          tags: cached.tags,
          tokenUsed: 0,
          qualityPassed: true,
          qualityNotes: ["served-from-cache"],
        }
      : await this.marvin.generateArticle({
          query: input.query,
          context: input.context,
          skills: settings.skills,
          rules: settings.rules,
        });

    if (!cached && result.qualityPassed) {
      await this.redis.setJson(cacheKey, {
        title: result.title,
        contentHtml: result.contentHtml,
        tags: result.tags,
        tokenUsed: result.tokenUsed,
      });
    }

    const article = await this.prisma.marvinArticle.create({
      data: {
        title: result.title,
        content: result.contentHtml,
        query: input.query,
        tags: result.tags,
        status: result.qualityPassed ? "draft" : "draft",
        tokenUsed: result.tokenUsed,
      },
    });

    await this.audit("generate", { query: input.query, articleId: article.id, notes: result.qualityNotes }, result.tokenUsed);
    return { article, quality: { passed: result.qualityPassed, notes: result.qualityNotes }, cached: Boolean(cached) };
  }

  async *generateStream(input: { query: string; context?: string; clientKey: string }) {
    if (!input.query?.trim()) throw new BadRequestException("query is required");
    const limited = await this.redis.hitRateLimit(input.clientKey, 10, 60);
    if (limited) throw new BadRequestException("Rate limit: 10 requests/min");

    const settings = await this.getSettings();
    let final: Awaited<ReturnType<MarvinBotClient["generateArticle"]>> | null = null;
    for await (const chunk of this.marvin.streamGenerate({
      query: input.query,
      context: input.context,
      skills: settings.skills,
      rules: settings.rules,
    })) {
      if (chunk.type === "token") {
        yield { event: "token", data: chunk.data as string };
      } else {
        final = chunk.data as Awaited<ReturnType<MarvinBotClient["generateArticle"]>>;
      }
    }
    if (!final) throw new BadRequestException("Empty generation");

    const article = await this.prisma.marvinArticle.create({
      data: {
        title: final.title,
        content: final.contentHtml,
        query: input.query,
        tags: final.tags,
        status: "draft",
        tokenUsed: final.tokenUsed,
      },
    });
    await this.audit("generate_stream", { query: input.query, articleId: article.id }, final.tokenUsed);
    yield {
      event: "done",
      data: JSON.stringify({
        article,
        quality: { passed: final.qualityPassed, notes: final.qualityNotes },
      }),
    };
  }

  async chatEdit(input: { articleId: string; message: string; clientKey: string }) {
    if (!input.message?.trim()) throw new BadRequestException("message is required");
    const limited = await this.redis.hitRateLimit(input.clientKey, 10, 60);
    if (limited) throw new BadRequestException("Rate limit: 10 requests/min");

    const article = await this.getArticle(input.articleId);
    const settings = await this.getSettings();
    const result = await this.marvin.editArticle({
      contentHtml: article.content,
      instruction: input.message,
      skills: settings.skills,
      rules: settings.rules,
    });

    const updated = await this.prisma.marvinArticle.update({
      where: { id: article.id },
      data: {
        title: result.title,
        content: result.contentHtml,
        tags: result.tags,
        tokenUsed: article.tokenUsed + result.tokenUsed,
      },
    });
    await this.audit("chat_edit", { articleId: article.id, message: input.message }, result.tokenUsed);
    return { article: updated, quality: { passed: result.qualityPassed, notes: result.qualityNotes } };
  }

  async analyzeTelegram(payload: { channels?: string[] }) {
    await this.audit("analyze_telegram", payload, 0);
    return {
      status: "accepted",
      message: "Анализ каналов запланирован (stub для будущего пайплайна)",
      channels: payload.channels || [],
    };
  }

  async exportArticle(id: string, format: "pdf" | "docx") {
    const article = await this.getArticle(id);
    if (format === "pdf") {
      const buf = await exportPdf(article.title, article.content);
      return { filename: `${article.id}.pdf`, contentType: "application/pdf", buffer: buf };
    }
    const buf = await exportDocx(article.title, article.content);
    return {
      filename: `${article.id}.docx`,
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: buf,
    };
  }

  private async audit(action: string, detail: unknown, tokens: number) {
    await this.prisma.marvinAuditLog.create({
      data: {
        action,
        detail: JSON.stringify(detail),
        tokens,
      },
    });
  }
}
