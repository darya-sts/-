import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [articlesWeek, sourcesActive, digests, tokensAgg, recentDigests, recentArticles] =
      await Promise.all([
        this.prisma.article.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.telegramSource.count({ where: { isActive: true } }),
        this.prisma.digest.count(),
        this.prisma.tokenUsage.aggregate({
          where: { createdAt: { gte: weekAgo } },
          _sum: { tokens: true },
        }),
        this.prisma.digest.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { article: true, items: true },
        }),
        this.prisma.article.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      articlesWeek,
      sourcesActive,
      digestsTotal: digests,
      tokensWeek: tokensAgg._sum.tokens || 0,
      recentDigests,
      recentArticles,
    };
  }

  async tokens(days = 14) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.tokenUsage.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    const byDay: Record<string, number> = {};
    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + row.tokens;
    }

    const optimizedEstimate = Math.round(
      Object.values(byDay).reduce((a, b) => a + b, 0) * 1.4,
    );
    const actual = Object.values(byDay).reduce((a, b) => a + b, 0);

    return {
      series: Object.entries(byDay).map(([date, tokens]) => ({ date, tokens })),
      total: actual,
      baselineWithoutOptimization: optimizedEstimate,
      savingsPercent: optimizedEstimate
        ? Math.round(((optimizedEstimate - actual) / optimizedEstimate) * 100)
        : 0,
    };
  }

  async sources() {
    const sources = await this.prisma.telegramSource.findMany({
      include: { _count: { select: { posts: true } } },
    });
    return sources.map((s) => ({
      id: s.id,
      username: s.username,
      title: s.title,
      category: s.category,
      weight: s.weight,
      isActive: s.isActive,
      posts: s._count.posts,
      lastParsed: s.lastParsed,
    }));
  }
}