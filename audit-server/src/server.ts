import express from 'express';
import pool from './db';
import { config } from './config';
import { ensureDatabase, migrate } from './initDb';
import { InMemoryAuditQueue } from './queue';
import { insertAuditBatch } from './worker';
import { createIngestRouter } from './routes/ingestion';
import { createQueryRouter } from './routes/query';
import { createAdminRouter } from './routes/admin';
import { createHealthRouter } from './routes/health';

async function start() {
  await ensureDatabase();
  await migrate();

  const app = express();
  app.set('trust proxy', true);
  const queue = new InMemoryAuditQueue({
    flushFn: async (payloads) => {
      await insertAuditBatch(pool, payloads);
    },
    bufferSize: config.ingestion.bufferSize,
    flushIntervalMs: config.ingestion.flushIntervalMs,
  });

  app.use(createHealthRouter());
  app.use(createIngestRouter(pool, queue));
  app.use(createQueryRouter(pool));
  app.use(createAdminRouter(pool));

  const server = app.listen(config.port, () => {
    console.log(`[audit-server] listening on port ${config.port}`);
  });

  async function shutdown() {
    console.log('[audit-server] shutting down...');
    server.close();
    await queue.close();
    await pool.end();
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

start().catch((err) => {
  console.error('[audit-server] failed to start:', err);
  process.exit(1);
});
