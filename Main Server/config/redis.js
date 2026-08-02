const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6380,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

async function setKey(key, value, ttlSeconds) {
  if (ttlSeconds) {
    await redis.set(key, value, 'EX', ttlSeconds);
  } else {
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

module.exports = {
  redis,
  setKey,
  getKey,
  deleteKey,
  exists,
  incr,
};
