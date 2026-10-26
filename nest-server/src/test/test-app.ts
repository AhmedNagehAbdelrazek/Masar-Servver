// Shared Nest test bootstrap. Mirrors Main Server/tests/setup/setup.ts:
// full AppModule, in-memory Redis (ioredis-mock), real isolated Postgres.
import { Reflector } from '@nestjs/core';
import { ApiValidationPipe } from '../common/pipes/api-validation.pipe.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import type { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import request, { type Agent } from 'supertest';
import { AppModule } from '../app.module.js';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { AppAuthGuard } from '../common/guards/app-auth.guard.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { LocalizeInterceptor } from '../common/interceptors/localize.interceptor.js';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

export interface TestContext {
  app: ReturnType<TestingModule['createNestApplication']>;
  agent: Agent;
  prisma: PrismaService;
  redis: Redis;
}

function buildRedisStub(redis: Redis): Partial<RedisService> {
  return {
    connection: redis as never,
    setKey: async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
      if (ttlSeconds) await redis.set(key, value, 'EX', ttlSeconds);
      else await redis.set(key, value);
    },
    getKey: (key: string): Promise<string | null> => redis.get(key) as Promise<string | null>,
    deleteKey: async (...keys: string[]): Promise<number> =>
      (keys.length === 0 ? 0 : await redis.del(...keys)) as number,
    exists: async (key: string): Promise<boolean> => ((await redis.exists(key)) as number) === 1,
    incr: (key: string): Promise<number> => redis.incr(key) as Promise<number>,
    keys: (pattern: string): Promise<string[]> => redis.keys(pattern) as Promise<string[]>,
    setKeyNx: async (key: string, value: string, ttlSeconds: number): Promise<boolean> => {
      const result = (await redis.set(key, value, 'EX', ttlSeconds, 'NX')) as unknown;
      return result === 'OK';
    },
    onModuleDestroy: async (): Promise<void> => undefined,
  };
}

export async function createTestApp(): Promise<TestContext> {
  const redis = new RedisMock();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(RedisService)
    .useValue(buildRedisStub(redis))
    .compile();
  // Same global chain as src/main.ts (guards live in bootstrap, not AppModule).
  const app = module.createNestApplication<NestExpressApplication>();
  app.useStaticAssets(join(process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), 'uploads')), {
    prefix: '/uploads/',
  });
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v2', { exclude: ['/'] });
  app.useGlobalPipes(new ApiValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LocalizeInterceptor(),
    app.get(AuditInterceptor),
  );
  app.useGlobalGuards(
    new AppAuthGuard(app.get(Reflector), app.get(JwtAuthGuard), app.get(RolesGuard)),
  );
  await app.init();
  const prisma = app.get(PrismaService);
  return { app, agent: request(app.getHttpServer()) as unknown as Agent, prisma, redis };
}
