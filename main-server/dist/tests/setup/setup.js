"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApp = getApp;
exports.getAgent = getAgent;
exports.getRedisStore = getRedisStore;
const globals_1 = require("@jest/globals");
// Tests assert English message texts; production default is Arabic (APP_LOCALE in .env).
process.env.APP_LOCALE = process.env.APP_LOCALE || 'en';
// Mock Redis — store must be created INSIDE the factory (Jest hoisting rule)
globals_1.jest.mock('../../config/redis', () => {
    const store = new Map();
    global.__mockRedisStore = store;
    return {
        __esModule: true,
        default: {
            set: globals_1.jest.fn(),
            get: globals_1.jest.fn(),
            del: globals_1.jest.fn(),
            keys: globals_1.jest.fn(),
        },
        setKey: globals_1.jest.fn(async (key, value) => {
            store.set(key, value);
        }),
        getKey: globals_1.jest.fn(async (key) => store.get(key) || null),
        deleteKey: globals_1.jest.fn(async (key) => {
            store.delete(key);
        }),
        exists: globals_1.jest.fn(async (key) => store.has(key)),
        incr: globals_1.jest.fn(async (key) => {
            const val = parseInt(store.get(key) || '0', 10) + 1;
            store.set(key, String(val));
            return val;
        }),
        redis: {
            get: globals_1.jest.fn(async (key) => store.get(key) || null),
            set: globals_1.jest.fn(async (key, value, ..._args) => {
                store.set(key, value);
                return 'OK';
            }),
            del: globals_1.jest.fn(async (...keys) => {
                let count = 0;
                keys.forEach((k) => {
                    if (store.delete(k))
                        count++;
                });
                return count;
            }),
            keys: globals_1.jest.fn(async (pattern) => {
                const prefix = pattern.replace('*', '');
                return [...store.keys()].filter((k) => k.startsWith(prefix));
            }),
            expire: globals_1.jest.fn(async (key, _ttl) => (store.has(key) ? 1 : 0)),
        },
    };
});
// These requires must happen AFTER jest.mock to get mocked versions; use commonjs require via dynamic import fallback
const createApp = require('../../app');
const sequelize = require('../../config/database');
let app;
let agent;
(0, globals_1.beforeAll)(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Database not available, tests may fail:', msg);
    }
    app = createApp();
    agent = require('supertest')(app);
});
(0, globals_1.afterAll)(async () => {
    try {
        const { audit } = require('../../config/audit');
        if (audit && typeof audit.close === 'function')
            await audit.close();
    }
    catch (_err) {
        // ignore
    }
    try {
        await sequelize.close();
    }
    catch (_err) {
        // ignore
    }
});
(0, globals_1.beforeEach)(() => {
    const store = global
        .__mockRedisStore;
    if (store)
        store.clear();
    globals_1.jest.clearAllMocks();
});
function getApp() {
    return app;
}
function getAgent() {
    return agent;
}
function getRedisStore() {
    return global.__mockRedisStore;
}
exports.default = { getApp, getAgent, getRedisStore };
module.exports = {
    getApp,
    getAgent,
    getRedisStore,
};
//# sourceMappingURL=setup.js.map