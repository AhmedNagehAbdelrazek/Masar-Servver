import { type TestingModule } from '@nestjs/testing';
import type { Redis } from 'ioredis';
import { type Agent } from 'supertest';
import { PrismaService } from '../prisma/prisma.service.js';
export interface TestContext {
    app: ReturnType<TestingModule['createNestApplication']>;
    agent: Agent;
    prisma: PrismaService;
    redis: Redis;
}
export declare function createTestApp(): Promise<TestContext>;
