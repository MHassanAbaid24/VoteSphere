export const cacheMap = new Map<string, { data: string; expiresAt: number }>();

/**
 * An in-memory/fallback caching utility matching the Redis cache pattern
 */
export const withCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = cacheMap.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return JSON.parse(cached.data) as T;
  }

  const data = await fetcher();

  cacheMap.set(key, {
    data: JSON.stringify(data),
    expiresAt: now + ttlSeconds * 1000,
  });

  return data;
};

/**
 * Invalidate a specific cache key
 */
export const invalidateCache = async (key: string): Promise<void> => {
  cacheMap.delete(key);
};
