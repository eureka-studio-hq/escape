import type { Store } from './core';

/** In-memory store for tests and local development. Not for production. */
export function memoryStore(now: () => number = Date.now): Store {
  const map = new Map<string, { value: string; expires: number }>();
  return {
    async set(key, value, ttlSeconds) {
      map.set(key, { value, expires: now() + ttlSeconds * 1000 });
    },
    async take(key) {
      const e = map.get(key);
      map.delete(key);
      if (!e || e.expires < now()) return null;
      return e.value;
    },
  };
}
