# @eureka-studio/escape-handoff

Carry a web game's saved progress across the jump from an in-app browser (X, Instagram, TikTok…) to Safari or Chrome. Companion to [`@eureka-studio/escape`](https://www.npmjs.com/package/@eureka-studio/escape).

The in-app browser's `localStorage` is not the system browser's. Without this, a player who taps "Open in Safari" arrives as a brand-new user.

```sh
npm install @eureka-studio/escape @eureka-studio/escape-handoff
```

## Link mode (no server, iOS)

Puts the selected keys into the URL hash. Nothing leaves the device.

```ts
import { escape } from '@eureka-studio/escape';
import { packIntoUrl, unpackFromLocation } from '@eureka-studio/escape-handoff';

// on page load, in any browser:
unpackFromLocation();

// on the "Open in Safari" tap:
escape({ url: packIntoUrl(location.href, 'game.'), medium: 'start' });
```

Android's Chrome intent cannot carry a hash, so use code mode there (or everywhere).

## Code mode (any server, iOS and Android)

Parks the snapshot on your server under a random single-use code, carries the code in the URL, claims it once in the system browser.

```ts
import { escape } from '@eureka-studio/escape';
import { createHandoff } from '@eureka-studio/escape-handoff';
import { fetchTransport } from '@eureka-studio/escape-server';

const handoff = createHandoff({
  keys: 'game.', // prefix, array of keys, or predicate
  transport: fetchTransport('/api/handoff'), // or your own { put, take }
  extra: () => ({ name: player.name }), // anything else to carry (optional)
});

// on page load, in any browser:
const claimed = await handoff.claim();
if (claimed) mergeProgress(claimed.payload); // your merge rules

// on the "Open in Safari" tap:
handoff.park(); // fire-and-forget
escape({ params: handoff.params(), medium: 'start' });
```

`claim()` writes the snapshot into `localStorage` by default. Pass `{ applySnapshot: false }` to receive the payload and merge it yourself, which is the right choice for anything like balances where "larger wins" or "never sum" rules apply.

The server side is two calls, `put(code, payload)` and `take(code)`. [`@eureka-studio/escape-server`](https://www.npmjs.com/package/@eureka-studio/escape-server) ships them for Cloudflare Workers and Vercel/Upstash.

## Protocol

- Code: 12 characters of `[a-z0-9]`, generated with `crypto.getRandomValues`, reused per in-app browser.
- Payload: `{ v: 1, snapshot, extra? }`, capped at 64 KB, expires after 30 minutes.
- `take` returns the payload once, then 404.
- `claim()` retries three times, 1.2 s apart, because the park request may still be in flight when the system browser opens.
- Emits `handoff_claimed` on the shared `onEvent` bus.

## License

MIT © Eureka Studios
