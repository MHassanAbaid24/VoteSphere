import Redis from 'ioredis';
import { env } from '../config/env';

export const cacheMap = new Map<string, { data: string; expiresAt: number }>();

// Initialize Redis if REDIS_URL is provided
let redis: Redis | null = null;
let redisHealthy = false;

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
  } catch (err: any) {
    console.warn('⚠️ Failed to initialize Redis Client, falling back to In-Memory Map:', err.message);
  }
}

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
        // Handle wildcard invalidations
        const keys = await redis.keys(key);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.del(key);
      }
    } catch (err: any) {
      console.warn(`⚠️ Redis deletion error for key "${key}":`, err.message);
    }
  }
};
