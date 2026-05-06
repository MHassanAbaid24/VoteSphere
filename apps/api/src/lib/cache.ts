import Redis from 'ioredis';
import { env } from '../config/env';

/**
 * A lightweight, zero-dependency Least Recently Used (LRU) Cache wrapper
 * around ES6 Map (which preserves insertion order). Capped at 5000 items.
 */
class SimpleLRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max = 5000) {
    this.max = max;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh key (move to most recent by deleting and re-inserting)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, val: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict oldest (the first key in insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, val);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheMap = new SimpleLRUCache<string, { data: string; expiresAt: number }>();

// Initialize Redis if REDIS_URL is provided
let redis: Redis | null = null;
let redisSub: Redis | null = null;
let redisHealthy = false;
let redisSubHealthy = false;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });
    
    redis.on('error', (err) => {
      console.warn('⚠️ Redis Client Error:', err.message);
      redisHealthy = false;
    });

    redis.on('connect', () => {
      redisHealthy = true;
    });

    redis.on('ready', () => {
      redisHealthy = true;
    });

    // Attempt initial connection asynchronously
    redis.connect().catch((err) => {
      console.warn('⚠️ Redis Connection Failed on Startup, falling back to In-Memory Map:', err.message);
      redisHealthy = false;
    });

    // Initialize dedicated Redis Subscriber client
    redisSub = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });

    redisSub.on('error', (err) => {
      console.warn('⚠️ Redis Sub Client Error:', err.message);
      redisSubHealthy = false;
    });

    redisSub.on('connect', () => {
      redisSubHealthy = true;
    });

    redisSub.on('ready', () => {
      redisSubHealthy = true;
    });

    redisSub.connect().catch((err) => {
      console.warn('⚠️ Redis Sub Connection Failed on Startup, SSE will use Polling Fallback:', err.message);
      redisSubHealthy = false;
    });
  } catch (err: any) {
    console.warn('⚠️ Failed to initialize Redis Clients, falling back to In-Memory Map:', err.message);
  }
}

/**
 * Get the dedicated Redis Subscriber client
 */
export const getRedisSubClient = (): Redis | null => redisSub;

/**
 * Check if the core Redis services are fully healthy and ready
 */
export const isRedisHealthy = (): boolean => {
  return (
    redis !== null &&
    redisSub !== null &&
    redisHealthy &&
    redisSubHealthy &&
    (redis.status === 'ready' || redis.status === 'connecting') &&
    (redisSub.status === 'ready' || redisSub.status === 'connecting')
  );
};

/**
 * Publish a message to a Redis channel cleanly.
 */
export const publishToRedis = async (channel: string, message: string): Promise<void> => {
  if (redis && (redisHealthy || redis.status === 'ready' || redis.status === 'connecting')) {
    try {
      await redis.publish(channel, message);
    } catch (err: any) {
      console.warn(`⚠️ Redis publish error on channel "${channel}":`, err.message);
    }
  }
};

/**
 * A robust caching utility utilizing Redis with automatic silent fallback to in-memory caching.
 */
export const withCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  if (redis && (redisHealthy || redis.status === 'ready' || redis.status === 'connecting')) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        console.info(`🚀 [Redis Cache Hit] Key: ${key}`);
        return JSON.parse(cached) as T;
      }
      
      console.info(`🔌 [Redis Cache Miss] Key: ${key} (Fetching from Database)`);
      const data = await fetcher();
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      return data;
    } catch (err: any) {
      console.warn(`⚠️ Redis read/write error for key "${key}", falling back to In-Memory:`, err.message);
      redisHealthy = false;
    }
  }

  // In-memory fallback
  const cached = cacheMap.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    console.info(`🚀 [Memory Cache Hit] Key: ${key}`);
    return JSON.parse(cached.data) as T;
  }

  console.info(`🔌 [Memory Cache Miss] Key: ${key} (Fetching from Database)`);
  const data = await fetcher();

  cacheMap.set(key, {
    data: JSON.stringify(data),
    expiresAt: now + ttlSeconds * 1000,
  });

  return data;
};

/**
 * Invalidate a specific cache key (both in Redis and In-Memory fallback).
 */
export const invalidateCache = async (key: string): Promise<void> => {
  // Always delete from local in-memory cache
  cacheMap.delete(key);

  if (redis) {
    try {
      if (key.includes('*')) {
        // Handle wildcard invalidations using SCAN cursor to avoid blocking KEYS
        let cursor = '0';
        const keysToDelete: string[] = [];
        do {
          const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
          cursor = nextCursor;
          keysToDelete.push(...foundKeys);
        } while (cursor !== '0');

        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete);
        }
      } else {
        await redis.del(key);
      }

      // Automatically publish invalidation message to trigger SSE real-time clients
      if (key.startsWith('poll:')) {
        await redis.publish(key, 'updated');
      }
    } catch (err: any) {
      console.warn(`⚠️ Redis deletion/publish error for key "${key}":`, err.message);
    }
  }
};
