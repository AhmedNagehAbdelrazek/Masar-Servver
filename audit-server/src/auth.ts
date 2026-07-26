import crypto from 'node:crypto';
import { Pool } from 'pg';

export interface AuthenticatedService {
  serviceId: string;
  serviceName: string;
  environment: string;
}

export async function verifyAuditRequest(params: {
  pool: Pool;
  serviceId: string;
  clientKey: string;
  timestamp: string;
  signature: string;
  rawBody: string;
  maxAgeMs?: number;
}): Promise<AuthenticatedService> {
  const {
    pool,
    serviceId,
    clientKey,
    timestamp,
    signature,
    rawBody,
    maxAgeMs = 5 * 60 * 1000,
  } = params;

  const now = Date.now();
  const requestTime = Number(timestamp);

  if (!requestTime || Math.abs(now - requestTime) > maxAgeMs) {
    throw new Error('Invalid or expired audit timestamp');
  }

  const result = await pool.query(
    `
    SELECT
      s.id AS service_id,
      s.name AS service_name,
      s.environment,
      c.secret_encrypted
    FROM audit.service_credentials c
    JOIN audit.services s ON s.id = c.service_id
    WHERE c.client_key = $1
      AND c.status = 'active'
      AND s.id = $2
      AND s.status = 'active'
    `,
    [clientKey, serviceId]
  );

  if (result.rows.length === 0) {
    throw new Error('Unknown or inactive audit service');
  }

  const row = result.rows[0];
  const secret = row.secret_encrypted;

  const bodyHash = crypto
    .createHash('sha256')
    .update(rawBody)
    .digest('hex');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${bodyHash}`)
    .digest('hex');
    
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid audit signature');
  }

  return {
    serviceId: row.service_id,
    serviceName: row.service_name,
    environment: row.environment,
  };
}
