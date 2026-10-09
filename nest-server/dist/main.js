import { Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AppAuthGuard } from './common/guards/app-auth.guard.js';
import { ApiValidationPipe } from './common/pipes/api-validation.pipe.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { RedisService } from './redis/redis.service.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: false });
    const logger = new Logger('Bootstrap');
    app.use(cors());
    app.use(helmet());
    app.use(morgan('short'));
    app.useBodyParser('json');
    app.useBodyParser('urlencoded', { extended: true });
    app.useStaticAssets(join(process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), 'uploads')), {
        prefix: '/uploads/',
    });
    app.setGlobalPrefix('api', { exclude: ['/'] });
    app.useGlobalPipes(new ApiValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor(), app.get(AuditInterceptor));
    app.useGlobalGuards(new AppAuthGuard(app.get(Reflector), app.get(JwtAuthGuard), app.get(RolesGuard)));
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Masar API (Nest)')
        .setDescription('Nest.js port of the Express Main Server. Express stays live until cutover.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    void createAdapter;
    void RedisService;
    logger.debug('Realtime gateway ready (Redis adapter pending phase-4)');
    const port = parseInt(process.env.PORT ?? '3001', 10);
    await app.listen(port);
    logger.log(`Nest server listening on port ${port}`);
}
await bootstrap();
//# sourceMappingURL=main.js.map