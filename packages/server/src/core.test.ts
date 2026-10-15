import { describe, expect, it } from 'vitest';
import { createHandler } from './core';
import { memoryStore } from './memory';
import { kvStore } from './cloudflare';
import { redisStore } from './upstash';

const CODE = 'abc123def456';
const payload = { v: 1, snapshot: { 'game.best': '9' } };

function post(handler: (r: Request) => Promise<Response>, body: unknown) {
  return handler(
    new Request('https://h.test/handoff', { method: 'POST', body: JSON.stringify(body) }),
  );
}
const get = (handler: (r: Request) => Promise<Response>, code: string) =>
  handler(new Request(`https://h.test/handoff?code=${code}`));

describe('protocol', () => {
  it('stores once and returns once', async () => {
    const handler = createHandler({ store: memoryStore() });
    expect((await post(handler, { code: CODE, payload })).status).toBe(204);
    const first = await get(handler, CODE);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ payload });
    expect((await get(handler, CODE)).status).toBe(404);
  });

  it('rejects bad codes, bad json and oversized bodies', async () => {
    const handler = createHandler({ store: memoryStore(), maxBytes: 100 });
    expect((await post(handler, { code: '../etc', payload })).status).toBe(400);
    expect((await get(handler, 'nope')).status).toBe(400);
    expect(
      (await handler(new Request('https://h.test/', { method: 'POST', body: '{' }))).status,
    ).toBe(400);
    expect((await post(handler, { code: CODE, payload: { big: 'x'.repeat(200) } })).status).toBe(
      413,
    );
    expect((await handler(new Request('https://h.test/', { method: 'DELETE' }))).status).toBe(405);
  });

  it('expires', async () => {
    let t = 0;
    const handler = createHandler({ store: memoryStore(() => t), ttlSeconds: 10 });
    await post(handler, { code: CODE, payload });
    t = 11_000;
    expect((await get(handler, CODE)).status).toBe(404);
  });

  it('adds CORS headers only for allowed origins', async () => {
    const handler = createHandler({ store: memoryStore(), allowOrigins: ['https://game.test'] });
    const ok = await handler(
      new Request('https://h.test/', {
        method: 'OPTIONS',
        headers: { origin: 'https://game.test' },
      }),
    );
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://game.test');
    const no = await handler(
      new Request('https://h.test/', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.test' },
      }),
    );
    expect(no.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('store adapters', () => {
  it('kvStore takes and deletes', async () => {
    const m = new Map<string, string>();
    const kv = {
      get: async (k: string) => m.get(k) ?? null,
      put: async (k: string, v: string) => void m.set(k, v),
      delete: async (k: string) => void m.delete(k),
    };
    const s = kvStore(kv);
    await s.set('k', 'v', 1);
    expect(await s.take('k')).toBe('v');
    expect(await s.take('k')).toBeNull();
  });

  it('redisStore prefers getdel and falls back to get+del', async () => {
    const m = new Map<string, string>();
    const base = {
      set: async (k: string, v: string) => void m.set(k, v),
      get: async (k: string) => m.get(k) ?? null,
      del: async (k: string) => void m.delete(k),
    };
    const s = redisStore(base);
    await s.set('k', 'v', 1);
    expect(await s.take('k')).toBe('v');
    expect(await s.take('k')).toBeNull();
    const withGetdel = redisStore({
      ...base,
      getdel: async (k: string) => {
        const v = m.get(k) ?? null;
        m.delete(k);
        return v;
      },
    });
    await withGetdel.set('k2', 'v2', 1);
    expect(await withGetdel.take('k2')).toBe('v2');
  });
});
