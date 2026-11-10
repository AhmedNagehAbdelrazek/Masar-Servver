import { Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DEV_ACCOUNT_PASSWORD,
  DEV_DRIVER_PHONE,
  DEV_PASSENGER_PHONE,
} from '../config/dev-accounts.js';

// Boot seed (mirrors main-server/seed.ts: admin + test accounts + dedicated
// developer accounts). Idempotent: existing rows are left untouched, except
// for the dedicated developer fixtures whose role/password are kept stable.
// Runs at server start unless SEED_ON_BOOT=false (never in test env).
// Legacy test accounts are skipped entirely in production; developer accounts
// are seeded in every environment so app developers can use the live API.
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

const DEV_ACCOUNTS = [
  {
    phone: DEV_DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver' as const,
    fullName: 'Developer Driver',
    password: DEV_ACCOUNT_PASSWORD,
    locale: 'en',
  },
  {
    phone: DEV_PASSENGER_PHONE,
    countryCode: 'JO',
    role: 'passenger' as const,
    fullName: 'Developer Passenger',
    password: DEV_ACCOUNT_PASSWORD,
    locale: 'en',
  },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.SEED_DEV_ACCOUNTS !== 'false') {
      await this.ensureDevAccounts();
    }
    if (process.env.SEED_ON_BOOT === 'false') {
      this.logger.log('SEED_ON_BOOT=false, skipping remaining boot seed.');
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

  private async ensureDevAccounts(): Promise<void> {
    for (const account of DEV_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(account.password, this.saltRounds());
      const user = await this.prisma.user.upsert({
        where: { phone: account.phone },
        update: {
          role: account.role,
          fullName: account.fullName,
          passwordHash,
          isVerified: true,
          verificationStatus: 'approved',
          status: 'active',
        },
        create: {
          phone: account.phone,
          countryCode: account.countryCode,
          role: account.role,
          fullName: account.fullName,
          passwordHash,
          isVerified: true,
          verificationStatus: 'approved',
          status: 'active',
          locale: account.locale,
        },
      });
      this.logger.log(`Developer account ready: ${account.phone} (${account.role}).`);
      if (account.role === 'driver') {
        await this.ensureDevVehicle(user.id);
      }
    }
  }

  private async ensureDevVehicle(driverId: string): Promise<void> {
    try {
      await this.prisma.vehicle.upsert({
        where: { driverId },
        update: { isVerified: true },
        create: {
          driverId,
          manufacturer: 'Toyota',
          model: 'Corolla',
          vehicleType: 'sedan',
          modelYear: 2024,
          plateNumber: 'DEV-0001',
          codeNumber: 'DEV 01',
          color: 'White',
          seats: 4,
          isVerified: true,
        },
      });
      this.logger.log('Developer driver vehicle ready (verified).');
    } catch (err: unknown) {
      this.logger.warn(
        `Could not create developer driver vehicle: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
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
