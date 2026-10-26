import { Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { resolveDatabaseUrl } from './config/database-url.js';
import { SeedService } from './seed/seed.service.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AppAuthGuard } from './common/guards/app-auth.guard.js';
import { LocalizeInterceptor } from './common/interceptors/localize.interceptor.js';
import { ApiValidationPipe } from './common/pipes/api-validation.pipe.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { RedisService } from './redis/redis.service.js';

// The server always boots on the latest migration: `prisma migrate deploy`
// runs before the app is created (skipped in test env and with
// AUTO_MIGRATE=false). A migrate failure fails the boot loudly — starting
// on a stale schema only produces confusing runtime errors.
// NOTE: the prisma CLI is a devDependency; pruned production images should
// run `prisma migrate deploy` in the entrypoint instead (same DATABASE_URL).
function autoMigrate(logger: Logger): void {
  if (process.env.NODE_ENV === 'test') return;
  if (process.env.AUTO_MIGRATE === 'false') {
    logger.log('AUTO_MIGRATE=false, skipping migrate deploy.');
    return;
  }
  logger.log('Applying database migrations (prisma migrate deploy)...');
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: resolveDatabaseUrl() },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  logger.log('Migrations up to date.');
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  autoMigrate(logger);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });

  // Idempotent boot seed (admin + dev test accounts, existing rows untouched).
  await app.get(SeedService).seed();

  // Mirrors Main Server/app.ts global chain: cors -> helmet -> audit -> morgan -> json.
  app.use(cors());
  app.use(helmet());
  app.use(morgan('short'));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });
  app.useStaticAssets(join(process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), 'uploads')), {
    prefix: '/uploads/',
  });

  // API_PREFIX versions the public surface: nest-server serves v2
  // (API_PREFIX=api/v2 in compose) while Express serves v1.
  // Default keeps local/test paths (/api/...) untouched.
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1', { exclude: ['/'] });
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Masar API (Nest)')
    .setDescription('Nest.js port of the Express Main Server. Express stays live until cutover.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Socket.IO Redis adapter (mirrors socketServer.ts; disabled in test).
  // TODO(phase-4): wire @socket.io/redis-adapter with ioredis pub/sub clients
  // for multi-instance scale. Single-instance works without it.
  void createAdapter;
  void RedisService;
  logger.debug('Realtime gateway ready (Redis adapter pending phase-4)');

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
  logger.log(`Nest server listening on port ${port}`);
}

await bootstrap();
