import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('redis.host', '127.0.0.1');
    const port = this.config.get<number>('redis.port', 6380);
    const password = this.config.get<string | undefined>('redis.password');
    this.client = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 2000)),
      lazyConnect: process.env.NODE_ENV === 'test',
    });
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: Error) => this.logger.error(`Redis error: ${err.message}`));
  }

  get connection(): Redis {
    return this.client;
  }

  async setKey(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
    else await this.client.set(key, value);
  }

  async getKey(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async deleteKey(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      this.client.disconnect();
    } catch {
      // best-effort
    }
  }
}
