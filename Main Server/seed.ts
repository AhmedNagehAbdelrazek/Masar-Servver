import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import sequelize from './config/database';
import { User } from './Models/index';

const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS as string, 10) || 12;

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

interface TestAccount {
  phone: string;
  countryCode: string;
  role: string;
  fullName: string;
  password: string;
  isVerified: boolean;
  locale: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
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

async function _seed(): Promise<void> {
  console.log('Seeding database...');

  await (sequelize as unknown as { authenticate: () => Promise<void> }).authenticate();
  console.log('Database connected.');

  await seedAdmin();

  console.log('Creating test accounts...');

  for (const account of TEST_ACCOUNTS) {
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
        locale: account.locale,
      },
    });

    if (!created) {
      await user.update({ passwordHash });
      console.log(`  Updated: ${account.phone} (${account.role})`);
    } else {
      console.log(`  Created: ${account.phone} (${account.role})`);
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Test Accounts Ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const account of TEST_ACCOUNTS) {
    console.log(`  ${account.fullName}`);
    console.log(`    Phone:    ${account.phone}`);
    console.log(`    Password: ${account.password}`);
    console.log(`    Role:     ${account.role}`);
    console.log('');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Sign in via: POST /api/auth/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await (sequelize as unknown as { close: () => Promise<void> }).close();
  console.log('Seeding complete!');
}

export { seedAdmin };
export default { seedAdmin };
module.exports = { seedAdmin };
