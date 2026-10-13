import { Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

// Boot seed (mirrors Main Server/seed.ts: admin + two test accounts).
// Idempotent and non-destructive: existing rows are left untouched —
// in particular passwords are NEVER overwritten (Express seed.ts re-hashed
// on every run; the boot seed must be safe to run on a live database).
// Runs at server start unless SEED_ON_BOOT=false (never in test env).
// Test accounts are skipped entirely in production.
const TEST_ACCOUNTS = [
  {
    phone: '+962700000000',
    countryCode: 'JO',
    role: 'driver' as const,
    fullName: 'Test Driver',
    password: 'Test@1234',
    locale: 'ar',
  },
  {
    phone: '+962711111111',
    countryCode: 'JO',
    role: 'passenger' as const,
    fullName: 'Test Passenger',
    password: 'Test@1234',
    locale: 'ar',
  },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.SEED_ON_BOOT === 'false') {
      this.logger.log('SEED_ON_BOOT=false, skipping boot seed.');
      return;
    }
    await this.ensureAdmin();
    if (process.env.NODE_ENV !== 'production') {
      await this.ensureTestAccounts();
    }
  }

  private saltRounds(): number {
    const parsed = parseInt(process.env.SALT_ROUNDS ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
  }

  private async ensureAdmin(): Promise<void> {
    const phone = process.env.SEED_ADMIN_PHONE;
    const username = process.env.SEED_ADMIN_USERNAME;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!phone || !username || !password) {
      this.logger.warn('SEED_ADMIN_* not fully set, skipping admin seed.');
      return;
    }
    const existing = await this.prisma.user.findFirst({ where: { phone }, select: { id: true } });
    if (existing) {
      this.logger.log(`Admin ${phone} already present, left untouched.`);
      return;
    }
    await this.prisma.user.create({
      data: {
        phone,
        role: 'admin',
        fullName: username,
        passwordHash: await bcrypt.hash(password, this.saltRounds()),
        countryCode: 'JO',
        isVerified: true,
        locale: 'en',
      },
    });
    this.logger.log(`Admin seeded: ${username} (${phone}).`);
  }

  private async ensureTestAccounts(): Promise<void> {
    for (const account of TEST_ACCOUNTS) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: account.phone },
        select: { id: true },
      });
      if (existing) {
        this.logger.log(`Test account ${account.phone} already present, left untouched.`);
        continue;
      }
      await this.prisma.user.create({
        data: {
          phone: account.phone,
          countryCode: account.countryCode,
          role: account.role,
          fullName: account.fullName,
          passwordHash: await bcrypt.hash(account.password, this.saltRounds()),
          isVerified: true,
          locale: account.locale,
        },
      });
      this.logger.log(`Test account seeded: ${account.phone} (${account.role}).`);
    }
  }
}
