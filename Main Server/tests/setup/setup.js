const createApp = require('../../app');
const sequelize = require('../../config/database');

// Tests assert English message texts; production default is Arabic (APP_LOCALE in .env).
process.env.APP_LOCALE = process.env.APP_LOCALE || 'en';

// Mock Redis — store must be created INSIDE the factory (Jest hoisting rule)
jest.mock('../../config/redis', () => {
  const store = new Map();
  global.__mockRedisStore = store;

  return {
    __esModule: true,
    default: {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    },
    setKey: jest.fn(async (key, value) => { store.set(key, value); }),
    getKey: jest.fn(async (key) => store.get(key) || null),
    deleteKey: jest.fn(async (key) => { store.delete(key); }),
    exists: jest.fn(async (key) => store.has(key)),
    incr: jest.fn(async (key) => {
      const val = parseInt(store.get(key) || '0', 10) + 1;
      store.set(key, String(val));
      return val;
    }),
    redis: {
      get: jest.fn(async (key) => store.get(key) || null),
      set: jest.fn(async (key, value, ..._args) => {
        store.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (...keys) => {
        let count = 0;
        keys.forEach(k => { if (store.delete(k)) count++; });
        return count;
      }),
      keys: jest.fn(async (pattern) => {
        const prefix = pattern.replace('*', '');
        return [...store.keys()].filter(k => k.startsWith(prefix));
      }),
      expire: jest.fn(async (key, _ttl) => store.has(key) ? 1 : 0),
    },
  };
});

let app;
let agent;

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (err) {
    console.warn('Database not available, tests may fail:', err.message);
  }
  app = createApp();
  agent = require('supertest')(app);
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (_err) {
    // ignore
  }
});

beforeEach(() => {
  const store = global.__mockRedisStore;
  if (store) store.clear();
  jest.clearAllMocks();
});

module.exports = {
  getApp: () => app,
  getAgent: () => agent,
  getRedisStore: () => global.__mockRedisStore,
};
