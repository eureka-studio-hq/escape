import { createHandler, type ProtocolOptions, type Store } from './core';

/** Minimal shape of a Workers KV namespace binding. */
export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export function kvStore(kv: KVNamespaceLike): Store {
  return {
    async set(key, value, ttlSeconds) {
      // KV enforces a 60 s minimum TTL.
      await kv.put(key, value, { expirationTtl: Math.max(60, ttlSeconds) });
    },
    async take(key) {
      const v = await kv.get(key);
      if (v != null) await kv.delete(key);
      return v;
    },
  };
}

/**
 * Cloudflare Worker handler.
 *
 *   import { cloudflareHandoff } from '@eureka-studio/escape-server/cloudflare';
 *   export default { fetch: (req, env) => cloudflareHandoff(env.HANDOFF)(req) };
 */
export function cloudflareHandoff(
  kv: KVNamespaceLike,
  options: Omit<ProtocolOptions, 'store'> = {},
) {
  return createHandler({ ...options, store: kvStore(kv) });
}
