import { jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Express } from 'express';
import type { SuperAgentTest } from 'supertest';

// Tests assert English message texts; production default is Arabic (APP_LOCALE in .env).
process.env.APP_LOCALE = process.env.APP_LOCALE || 'en';

interface MockRedisStore extends Map<string, string> {}

// Mock Redis — store must be created INSIDE the factory (Jest hoisting rule)
jest.mock('../../config/redis', () => {
  const store: Map<string, string> = new Map();
  (global as unknown as { __mockRedisStore: Map<string, string> }).__mockRedisStore = store;

  return {
    __esModule: true,
    default: {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    },
    setKey: jest.fn(async (key: string, value: string): Promise<void> => {
      store.set(key, value);
    }),
    getKey: jest.fn(async (key: string): Promise<string | null> => store.get(key) || null),
    deleteKey: jest.fn(async (key: string): Promise<void> => {
      store.delete(key);
    }),
    exists: jest.fn(async (key: string): Promise<boolean> => store.has(key)),
    incr: jest.fn(async (key: string): Promise<number> => {
      const val: number = parseInt(store.get(key) || '0', 10) + 1;
      store.set(key, String(val));
      return val;
    }),
    redis: {
      get: jest.fn(async (key: string): Promise<string | null> => store.get(key) || null),
      set: jest.fn(async (key: string, value: string, ..._args: unknown[]): Promise<string> => {
        store.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (...keys: string[]): Promise<number> => {
        let count = 0;
        keys.forEach((k: string) => {
          if (store.delete(k)) count++;
        });
        return count;
      }),
      keys: jest.fn(async (pattern: string): Promise<string[]> => {
        const prefix: string = pattern.replace('*', '');
        return [...store.keys()].filter((k: string) => k.startsWith(prefix));
      }),
      expire: jest.fn(async (key: string, _ttl: number): Promise<number> => (store.has(key) ? 1 : 0)),
    },
  };
});

// These requires must happen AFTER jest.mock to get mocked versions; use commonjs require via dynamic import fallback
const createApp: () => Express = require('../../app');
const sequelize: {
  authenticate: () => Promise<void>;
  sync: (opts: unknown) => Promise<void>;
  close: () => Promise<void>;
} = require('../../config/database');

let app: Express;
let agent: SuperAgentTest;

beforeAll(async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.warn('Database not available, tests may fail:', msg);
  }
  app = createApp();
    agent = require('supertest')(app) as SuperAgentTest;
});

afterAll(async (): Promise<void> => {
  try {
        const { audit } = require('../../config/audit') as { audit?: { close?: () => Promise<void> } };
    if (audit && typeof audit.close === 'function') await audit.close();
  } catch (_err: unknown) {
    // ignore
  }
  try {
    await sequelize.close();
  } catch (_err: unknown) {
    // ignore
  }
});

beforeEach(() => {
  const store: MockRedisStore | undefined = (global as unknown as { __mockRedisStore?: MockRedisStore })
    .__mockRedisStore;
  if (store) store.clear();
  jest.clearAllMocks();
});

export function getApp(): Express {
  return app;
}
export function getAgent(): SuperAgentTest {
  return agent;
}
export function getRedisStore(): MockRedisStore | undefined {
  return (global as unknown as { __mockRedisStore?: MockRedisStore }).__mockRedisStore;
}

export default { getApp, getAgent, getRedisStore };
module.exports = {
  getApp,
  getAgent,
  getRedisStore,
};
