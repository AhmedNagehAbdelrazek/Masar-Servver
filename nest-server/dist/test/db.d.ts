import type { Redis } from 'ioredis';
import type { PrismaService } from '../prisma/prisma.service.js';
export declare function truncateAll(prisma: PrismaService): Promise<void>;
export declare function resetTestState(prisma: PrismaService, redis: Redis): Promise<void>;
