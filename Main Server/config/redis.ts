import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6380,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err: Error) => console.error('Redis error:', err.message));

async function setKey(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await redis.set(key, value, 'EX', ttlSeconds);
  } else {
    await redis.set(key, value);
  }
}

async function getKey(key: string): Promise<string | null> {
  return redis.get(key);
}

async function deleteKey(key: string): Promise<void> {
  await redis.del(key);
}

async function exists(key: string): Promise<boolean> {
  const result: number = await redis.exists(key);
  return result === 1;
}

async function incr(key: string): Promise<number> {
  return redis.incr(key);
}

export { redis, setKey, getKey, deleteKey, exists, incr };
export default { redis, setKey, getKey, deleteKey, exists, incr };
module.exports = { redis, setKey, getKey, deleteKey, exists, incr };
