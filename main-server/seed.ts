import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import sequelize from './config/database';
import { User, Vehicle } from './Models/index';
import {
  DEV_ACCOUNT_PASSWORD,
  DEV_DRIVER_PHONE,
  DEV_PASSENGER_PHONE,
} from './config/constants';

const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS as string, 10) || 12;

interface SeedAccount {
  phone: string;
  countryCode: string;
  role: string;
  fullName: string;
  password: string;
  isVerified: boolean;
  locale: string;
}

const TEST_ACCOUNTS: SeedAccount[] = [
  {
    phone: '+962700000000',
    countryCode: 'JO',
    role: 'driver',
    fullName: 'Test Driver',
    password: 'Test@1234',
    isVerified: true,
    locale: 'ar',
  },
  {
    phone: '+962711111111',
    countryCode: 'JO',
    role: 'passenger',
    fullName: 'Test Passenger',
    password: 'Test@1234',
    isVerified: true,
    locale: 'ar',
  },
];

const DEV_ACCOUNTS: SeedAccount[] = [
  {
    phone: DEV_DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    fullName: 'Developer Driver',
    password: DEV_ACCOUNT_PASSWORD,
    isVerified: true,
    locale: 'en',
  },
  {
    phone: DEV_PASSENGER_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    fullName: 'Developer Passenger',
    password: DEV_ACCOUNT_PASSWORD,
    isVerified: true,
    locale: 'en',
  },
];

async function seedAdmin(): Promise<void> {
  const phone: string | undefined = process.env.SEED_ADMIN_PHONE;
  const username: string | undefined = process.env.SEED_ADMIN_USERNAME;
  const password: string | undefined = process.env.SEED_ADMIN_PASSWORD;

  if (!phone || !username || !password) {
    console.log('[seed] SEED_ADMIN_PHONE, SEED_ADMIN_USERNAME, or SEED_ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }

  const passwordHash: string = await bcrypt.hash(password, SALT_ROUNDS);

  const [user, created] = await (User as unknown as { findOrCreate: (o: unknown) => Promise<[ { update: (d: unknown) => Promise<void> }, boolean]> }).findOrCreate({
    where: { phone },
    defaults: {
      phone,
      role: 'admin',
      fullName: username,
      passwordHash,
      isVerified: true,
      locale: 'en',
    },
  });

  if (!created) {
    await user.update({ passwordHash, fullName: username });
    console.log(`[seed] Admin updated: ${username} (${phone})`);
  } else {
    console.log(`[seed] Admin created: ${username} (${phone})`);
  }
}

async function ensureAccount(account: SeedAccount): Promise<void> {
  const passwordHash: string = await bcrypt.hash(account.password, SALT_ROUNDS);

  const [user, created] = await (User as unknown as { findOrCreate: (o: unknown) => Promise<[ { update: (d: unknown) => Promise<void> }, boolean]> }).findOrCreate({
    where: { phone: account.phone },
    defaults: {
      phone: account.phone,
      countryCode: account.countryCode,
      role: account.role,
      fullName: account.fullName,
      passwordHash,
      isVerified: account.isVerified,
      verificationStatus: 'approved',
      status: 'active',
      locale: account.locale,
    },
  });

  if (!created) {
    // Dev accounts are disposable fixtures: keep the role and known password
    // stable so developers always have a working login.
    await user.update({
      role: account.role,
      fullName: account.fullName,
      passwordHash,
      isVerified: account.isVerified,
      verificationStatus: 'approved',
      status: 'active',
    });
    console.log(`  Updated: ${account.phone} (${account.role})`);
  } else {
    console.log(`  Created: ${account.phone} (${account.role})`);
  }
}

async function ensureDevVehicle(driverId: string): Promise<void> {
  try {
    const [vehicle, created] = await (Vehicle as unknown as {
      findOrCreate: (o: unknown) => Promise<[ { update: (d: unknown) => Promise<void> }, boolean]>;
    }).findOrCreate({
      where: { driverId },
      defaults: {
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

    if (!created) {
      await vehicle.update({ isVerified: true });
      console.log('  Dev driver vehicle already present (verified).');
    } else {
      console.log('  Dev driver vehicle created (verified).');
    }
  } catch (err: unknown) {
    console.warn(
      `[seed] Could not create dev driver vehicle: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function seedDevAccounts(): Promise<void> {
  if (process.env.SEED_DEV_ACCOUNTS === 'false') {
    console.log('[seed] SEED_DEV_ACCOUNTS=false — skipping developer accounts');
    return;
  }

  console.log('[seed] Ensuring developer accounts...');
  for (const account of DEV_ACCOUNTS) {
    await ensureAccount(account);
  }

  const driver = await (User as unknown as {
    findOne: (o: unknown) => Promise<{ id: string } | null>;
  }).findOne({ where: { phone: DEV_DRIVER_PHONE }, attributes: ['id'] });
  if (driver) await ensureDevVehicle(driver.id);
}

async function seedTestAccounts(): Promise<void> {
  console.log('[seed] Ensuring test accounts...');
  for (const account of TEST_ACCOUNTS) {
    await ensureAccount(account);
  }
}

async function _seed(): Promise<void> {
  console.log('Seeding database...');

  await (sequelize as unknown as { authenticate: () => Promise<void> }).authenticate();
  console.log('Database connected.');

  await seedAdmin();
  await seedDevAccounts();
  await seedTestAccounts();

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Developer Accounts Ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const account of DEV_ACCOUNTS) {
    console.log(`  ${account.fullName}`);
    console.log(`    Phone:    ${account.phone}`);
    console.log(`    Password: ${account.password}`);
    console.log(`    OTP:      000000 (fixed)`);
    console.log(`    Role:     ${account.role}`);
    console.log('');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Sign in via: POST /api/auth/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await (sequelize as unknown as { close: () => Promise<void> }).close();
  console.log('Seeding complete!');
}

if (require.main === module) {
  _seed().catch((err: unknown) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

export { seedAdmin, seedDevAccounts, seedTestAccounts };
export default { seedAdmin, seedDevAccounts, seedTestAccounts };
module.exports = { seedAdmin, seedDevAccounts, seedTestAccounts };
