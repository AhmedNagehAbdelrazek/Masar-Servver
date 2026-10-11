import type { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from './prisma.service.js';

export type SerializableTx = Prisma.TransactionClient;

const DEFAULT_ATTEMPTS = 3;

function isSerializationFailure(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  if (code === 'P2034') return true;
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /could not serialize|serialization failure|\b40001\b/i.test(message);
}

// Runs fn in a Serializable transaction, retrying serialization failures
// (Prisma P2034). Postgres equivalent of the Sequelize LOCK.UPDATE critical
// sections in the Express money flows.
export async function withSerializableRetry<T>(
  prisma: PrismaService,
  fn: (tx: SerializableTx) => Promise<T>,
  maxAttempts = DEFAULT_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction((tx) => fn(tx), {
        isolationLevel: 'Serializable',
      });
    } catch (err) {
      lastError = err;
      if (attempt >= maxAttempts || !isSerializationFailure(err)) throw err;
    }
  }
  throw lastError;
}
