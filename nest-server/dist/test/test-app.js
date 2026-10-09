import { Reflector } from '@nestjs/core';
import { ApiValidationPipe } from '../common/pipes/api-validation.pipe.js';
import { Test } from '@nestjs/testing';
import { join } from 'node:path';
import RedisMock from 'ioredis-mock';
import request from 'supertest';
import { AppModule } from '../app.module.js';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { AppAuthGuard } from '../common/guards/app-auth.guard.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
function buildRedisStub(redis) {
    return {
        connection: redis,
        setKey: async (key, value, ttlSeconds) => {
            if (ttlSeconds)
                await redis.set(key, value, 'EX', ttlSeconds);
            else
                await redis.set(key, value);
        },
        getKey: (key) => redis.get(key),
        deleteKey: async (...keys) => (keys.length === 0 ? 0 : await redis.del(...keys)),
        exists: async (key) => (await redis.exists(key)) === 1,
        incr: (key) => redis.incr(key),
        onModuleDestroy: async () => undefined,
    };
}
export async function createTestApp() {
    const redis = new RedisMock();
    const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(RedisService)
        .useValue(buildRedisStub(redis))
        .compile();
    const app = module.createNestApplication();
    app.useStaticAssets(join(process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), 'uploads')), {
        prefix: '/uploads/',
    });
    app.setGlobalPrefix('api', { exclude: ['/'] });
    app.useGlobalPipes(new ApiValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor(), app.get(AuditInterceptor));
    app.useGlobalGuards(new AppAuthGuard(app.get(Reflector), app.get(JwtAuthGuard), app.get(RolesGuard)));
    await app.init();
    const prisma = app.get(PrismaService);
    return { app, agent: request(app.getHttpServer()), prisma, redis };
}
//# sourceMappingURL=test-app.js.map