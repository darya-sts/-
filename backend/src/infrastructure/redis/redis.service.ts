import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { createHash } from "crypto";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  private getRedis(): Redis {
    if (!this.client) {
      const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      this.client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      this.client.on("error", (err) => this.logger.warn(`Redis: ${err.message}`));
    }
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  cacheKey(query: string, context?: string): string {
    return `marvin:article:${createHash("sha256").update(`${query}::${context || ""}`).digest("hex")}`;
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const redis = this.getRedis();
      if (redis.status !== "ready") await redis.connect();
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSec = 3600): Promise<void> {
    try {
      const redis = this.getRedis();
      if (redis.status !== "ready") await redis.connect();
      await redis.set(key, JSON.stringify(value), "EX", ttlSec);
    } catch {
      // cache is best-effort
    }
  }

  async hitRateLimit(bucket: string, limit = 10, windowSec = 60): Promise<boolean> {
    try {
      const redis = this.getRedis();
      if (redis.status !== "ready") await redis.connect();
      const key = `marvin:rl:${bucket}`;
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, windowSec);
      return n > limit;
    } catch {
      return false;
    }
  }
}
