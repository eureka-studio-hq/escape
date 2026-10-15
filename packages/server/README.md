# @eureka-studio/escape-server

Server side of [`@eureka-studio/escape-handoff`](https://www.npmjs.com/package/@eureka-studio/escape-handoff): a tiny single-use key-value protocol with ready-made handlers.

```
POST /handoff           { code, payload }   → 204
GET  /handoff?code=…    → 200 { payload } once, then 404
```

Codes are 12 characters of `[a-z0-9]`; payloads are capped (64 KB) and expire (30 minutes). CORS headers are added only for origins you list.

## Cloudflare Workers (KV)

```ts
import { cloudflareHandoff } from '@eureka-studio/escape-server/cloudflare';

export default {
  fetch: (req: Request, env: { HANDOFF: KVNamespace }) =>
    cloudflareHandoff(env.HANDOFF, { allowOrigins: ['https://yourgame.com'] })(req),
};
```

## Vercel / Node with Upstash Redis

```ts
import { Redis } from '@upstash/redis';
import { upstashHandoff } from '@eureka-studio/escape-server/upstash';

const handler = upstashHandoff(Redis.fromEnv());
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
```

## Anything else

```ts
import { createHandler } from '@eureka-studio/escape-server';

const handler = createHandler({
  store: {
    set: (key, value, ttlSeconds) => …,
    take: (key) => …,   // return once, then null
  },
});
```

`memoryStore()` is included for tests and local development.

## Client transport

```ts
import { fetchTransport } from '@eureka-studio/escape-server';
createHandoff({ keys: 'game.', transport: fetchTransport('/api/handoff') });
```

## License

MIT © Eureka Studios
