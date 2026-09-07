import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memory = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      try {
        this.client = new Redis(url, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        this.client.connect().catch((err) => {
          this.logger.warn(`Redis недоступен, используем in-memory кэш: ${err.message}`);
          this.client = null;
        });
      } catch (err: any) {
        this.logger.warn(`Redis init error: ${err.message}`);
        this.client = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit().catch(() => undefined);
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        /* fallback */
      }
    }
    const item = this.memory.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
        else await this.client.set(key, value);
        return;
      } catch {
        /* fallback */
      }
    }
    this.memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
      } catch {
        /* ignore */
      }
    }
    this.memory.delete(key);
  }
}