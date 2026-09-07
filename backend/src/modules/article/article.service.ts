import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { clampArticle } from '../../common/utils/nlp.util';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appLogger: LoggerService,
  ) {}

  list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.article.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { digest: { select: { id: true, date: true, status: true } } },
      }),
      this.prisma.article.count(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  async get(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        digest: {
          include: {
            items: { include: { post: { include: { source: true } } } },
          },
        },
      },
    });
    if (!article) throw new NotFoundException('Статья не найдена');
    return article;
  }

  async update(id: string, data: { title?: string; content?: string; status?: string }) {
    await this.get(id);
    const content = data.content ? clampArticle(data.content, 2500) : undefined;
    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        content,
        status: data.status,
      },
    });
    await this.appLogger.audit('article.updated', 'Article', id);
    return updated;
  }

  async publish(id: string) {
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
    });
    await this.appLogger.audit('article.published', 'Article', id);
    return updated;
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.article.delete({ where: { id } });
    await this.appLogger.audit('article.deleted', 'Article', id);
    return { ok: true };
  }
}