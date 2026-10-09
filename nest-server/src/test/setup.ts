// Vitest setup file: loads .env.test before any app module is imported.
// Mirrors Main Server/tests/setup/env.ts (NODE_ENV=test, APP_LOCALE=en).
import { config } from 'dotenv';
import { join } from 'node:path';

config({ path: join(process.cwd(), '.env.test') });
process.env.NODE_ENV = 'test';
process.env.APP_LOCALE ??= 'en';
