import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { config } from 'dotenv';
import { resolveDatabaseUrl } from '../config/database-url.js';

config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = resolveDatabaseUrl();
    // Prisma 7 requires a driver adapter. Empty connection string is only
    // tolerated in test env (where onModuleInit skips connecting).
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    if (!process.env.DATABASE_URL) return;
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
