/**
 * Singleton Redis client compartido — conexión lazy al arrancar.
 * Usado por rutas que necesitan caché sin requerir cambios en index.ts.
 */

import { createClient, RedisClientType } from 'redis';
import { CacheManager } from './CacheManager.js';
import { logger } from '../../utils/logger.js';

let _cache: CacheManager | null = null;
let _connecting = false;

export async function getSharedCache(): Promise<CacheManager | null> {
  if (_cache) { return _cache; }
  if (_connecting || !process.env.REDIS_URL) { return null; }
  _connecting = true;
  try {
    const client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
    client.on('error', (err: Error) =>
      logger.warn({ msg: 'Redis client error', error: err.message })
    );
    await client.connect();
    _cache = new CacheManager(client);
    logger.info({ msg: 'Shared Redis cache connected' });
  } catch (err) {
    logger.warn({ msg: 'Redis cache unavailable — continuing without cache', error: String(err) });
  }
  _connecting = false;
  return _cache;
}
