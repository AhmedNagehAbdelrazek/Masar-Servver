import type { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from './prisma.service.js';
export type SerializableTx = Prisma.TransactionClient;
export declare function withSerializableRetry<T>(prisma: PrismaService, fn: (tx: SerializableTx) => Promise<T>, maxAttempts?: number): Promise<T>;
