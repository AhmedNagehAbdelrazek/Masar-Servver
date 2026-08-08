import express from 'express';
import { Pool } from 'pg';
import { verifyAuditRequest } from '../auth';
import { AuditQueue } from '../queue';
import { config } from '../config';

export function createIngestRouter(pool: Pool, queue: AuditQueue) {
  const router = express.Router();

  // Use express.raw() to capture the body as a Buffer — this preserves
  // the raw bytes for HMAC verification AND doesn't consume the stream
  // before JSON parsing.
  router.post(
    '/v1/audit/ingest',
    express.raw({ type: 'application/json', limit: config.ingestion.maxBatchBytes }),
    async (req: any, res) => {
      try {
        const rawBody = req.body.toString('utf8');

        const service = await verifyAuditRequest({
          pool,
          serviceId: req.headers['x-audit-service-id'] as string,
          clientKey: req.headers['x-audit-client-key'] as string,
          timestamp: req.headers['x-audit-timestamp'] as string,
          signature: req.headers['x-audit-signature'] as string,
          rawBody,
        });

        let payload;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Body is not valid JSON' } });
          return;
        }

        await queue.add({
          service,
          events: payload.events ?? [],
          spans: payload.spans ?? [],
        });

        res.status(202).json({ accepted: true });
      } catch (err: any) {
        console.error('[audit-server] ingest error', err.message);
        res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Audit ingestion rejected' },
        });
      }
    }
  );

  return router;
}
