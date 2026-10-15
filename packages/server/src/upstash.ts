import { createHandler, type ProtocolOptions, type Store } from './core';

/** Minimal shape of an Upstash Redis client (or any client with set/getdel). */
export interface RedisLike {
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  getdel?(key: string): Promise<string | null>;
  get?(key: string): Promise<string | null>;
  del?(key: string): Promise<unknown>;
}

export function redisStore(redis: RedisLike): Store {
  return {
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    async take(key) {
      if (redis.getdel) return (await redis.getdel(key)) ?? null;
      const v = (await redis.get?.(key)) ?? null;
      if (v != null) await redis.del?.(key);
      return v;
    },
  };
}

/**
 * Vercel / Node handler backed by Upstash Redis (web-standard Request/Response).
 *
 *   import { Redis } from '@upstash/redis';
 *   import { upstashHandoff } from '@eureka-studio/escape-server/upstash';
 *   const handler = upstashHandoff(Redis.fromEnv());
 *   export const GET = handler; export const POST = handler; export const OPTIONS = handler;
 */
export function upstashHandoff(redis: RedisLike, options: Omit<ProtocolOptions, 'store'> = {}) {
  return createHandler({ ...options, store: redisStore(redis) });
}
