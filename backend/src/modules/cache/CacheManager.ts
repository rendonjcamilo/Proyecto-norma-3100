import { RedisClientType } from 'redis';
import { logger } from '../../utils/logger.js';

/**
 * CacheManager - Redis-backed caching with TTL support
 */
export class CacheManager {
  constructor(private redis: RedisClientType) {}

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setEx(key, ttlSeconds, serialized);

      logger.debug({
        msg: 'Cache set',
        key,
        ttl: ttlSeconds,
      });
    } catch (err) {
      logger.error({
        msg: 'Cache set error',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (!value) {
        logger.debug({
          msg: 'Cache miss',
          key,
        });
        return null;
      }

      logger.debug({
        msg: 'Cache hit',
        key,
      });

      return JSON.parse(value) as T;
    } catch (err) {
      logger.error({
        msg: 'Cache get error',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  /**
   * Delete a cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);

      logger.debug({
        msg: 'Cache deleted',
        key,
      });
    } catch (err) {
      logger.error({
        msg: 'Cache delete error',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushDb();

      logger.info({
        msg: 'Cache cleared',
      });
    } catch (err) {
      logger.error({
        msg: 'Cache clear error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Get cache size (number of keys)
   */
  async getSize(): Promise<number> {
    try {
      const size = await this.redis.dbSize();
      return size;
    } catch (err) {
      logger.error({
        msg: 'Cache size error',
        error: err instanceof Error ? err.message : String(err),
      });
      return 0;
    }
  }

  /**
   * Get cache info
   */
  async getInfo(): Promise<Record<string, unknown>> {
    try {
      const info = await this.redis.info('stats');
      return {
        info,
        keys: await this.redis.dbSize(),
        memory: await this.redis.info('memory'),
      };
    } catch (err) {
      logger.error({
        msg: 'Cache info error',
        error: err instanceof Error ? err.message : String(err),
      });
      return {};
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset(entries: Map<string, unknown>, ttlSeconds = 3600): Promise<void> {
    try {
      for (const [key, value] of entries) {
        await this.set(key, value, ttlSeconds);
      }

      logger.debug({
        msg: 'Batch cache set',
        count: entries.size,
      });
    } catch (err) {
      logger.error({
        msg: 'Batch cache set error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    try {
      const result = new Map<string, T | null>();

      for (const key of keys) {
        const value = await this.get<T>(key);
        result.set(key, value);
      }

      return result;
    } catch (err) {
      logger.error({
        msg: 'Batch cache get error',
        error: err instanceof Error ? err.message : String(err),
      });
      return new Map();
    }
  }
}
