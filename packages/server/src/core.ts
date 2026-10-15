/**
 * Framework-free hand-off protocol. Plug in any key-value store with a TTL and you get a
 * fetch-style handler:
 *
 *   POST <path>            body { code, payload }   → 204
 *   GET  <path>?code=…     → 200 { payload } once, then 404
 *
 * Codes are 12 chars of [a-z0-9]; payloads are capped (default 64 KB) and expire (default 30 min).
 */
export interface Store {
  /** Store `value` under `key` for `ttlSeconds`. */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Return the value and delete it in one step (or get-then-delete when the store has no atomic op). */
  take(key: string): Promise<string | null>;
}

export interface ProtocolOptions {
  store: Store;
  /** Seconds a parked payload lives. Default 1800 (30 minutes). */
  ttlSeconds?: number;
  /** Maximum JSON size of a payload in bytes. Default 65536. */
  maxBytes?: number;
  /** Key prefix in the store. Default "escape:handoff:". */
  prefix?: string;
  /** Allowed origins for CORS. Default: same origin only (no CORS headers). */
  allowOrigins?: string[];
}

const CODE_RE = /^[a-z0-9]{12}$/;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
}

export function createHandler(options: ProtocolOptions): (request: Request) => Promise<Response> {
  const ttl = options.ttlSeconds ?? 1800;
  const maxBytes = options.maxBytes ?? 65_536;
  const prefix = options.prefix ?? 'escape:handoff:';
  const allow = options.allowOrigins ?? [];

  const cors = (req: Request): Record<string, string> => {
    const origin = req.headers.get('origin');
    if (!origin || !allow.includes(origin)) return {};
    return {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      vary: 'origin',
    };
  };

  return async (request: Request): Promise<Response> => {
    const h = cors(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    if (request.method === 'POST') {
      let body: { code?: unknown; payload?: unknown };
      try {
        const text = await request.text();
        if (text.length > maxBytes) return json(413, { error: 'payload too large' }, h);
        body = JSON.parse(text) as typeof body;
      } catch {
        return json(400, { error: 'invalid json' }, h);
      }
      const code = typeof body.code === 'string' ? body.code : '';
      if (!CODE_RE.test(code)) return json(400, { error: 'invalid code' }, h);
      if (!body.payload || typeof body.payload !== 'object')
        return json(400, { error: 'invalid payload' }, h);
      await options.store.set(prefix + code, JSON.stringify(body.payload), ttl);
      return new Response(null, { status: 204, headers: h });
    }

    if (request.method === 'GET') {
      const code = new URL(request.url).searchParams.get('code') ?? '';
      if (!CODE_RE.test(code)) return json(400, { error: 'invalid code' }, h);
      const raw = await options.store.take(prefix + code);
      if (raw == null) return json(404, { error: 'not found' }, h);
      try {
        return json(200, { payload: JSON.parse(raw) }, h);
      } catch {
        return json(404, { error: 'not found' }, h);
      }
    }

    return json(405, { error: 'method not allowed' }, { ...h, allow: 'GET, POST, OPTIONS' });
  };
}

/** A matching client-side Transport for @eureka-studio/escape-handoff, pointed at this handler. */
export function fetchTransport(endpoint: string, init: RequestInit = {}) {
  return {
    async put(code: string, payload: unknown): Promise<void> {
      await fetch(endpoint, {
        ...init,
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
        body: JSON.stringify({ code, payload }),
        keepalive: true,
      });
    },
    async take(code: string) {
      const res = await fetch(`${endpoint}?code=${encodeURIComponent(code)}`, {
        ...init,
        method: 'GET',
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`handoff take failed: ${res.status}`);
      const body = (await res.json()) as { payload: unknown };
      return body.payload as never;
    },
  };
}
