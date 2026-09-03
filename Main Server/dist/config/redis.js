"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.setKey = setKey;
exports.getKey = getKey;
exports.deleteKey = deleteKey;
exports.exists = exists;
exports.incr = incr;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6380,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
exports.redis = redis;
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));
async function setKey(key, value, ttlSeconds) {
    if (ttlSeconds) {
        await redis.set(key, value, 'EX', ttlSeconds);
    }
    else {
        await redis.set(key, value);
    }
}
async function getKey(key) {
    return redis.get(key);
}
async function deleteKey(key) {
    await redis.del(key);
}
async function exists(key) {
    const result = await redis.exists(key);
    return result === 1;
}
async function incr(key) {
    return redis.incr(key);
}
exports.default = { redis, setKey, getKey, deleteKey, exists, incr };
module.exports = { redis, setKey, getKey, deleteKey, exists, incr };
//# sourceMappingURL=redis.js.map