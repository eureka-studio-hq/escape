<p align="center">
  <img src="https://raw.githubusercontent.com/eureka-studio-hq/escape/main/.github/assets/banner.png" alt="escape — leave the in-app browser, keep your progress" width="100%">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@eureka-studio/escape"><img alt="npm version" src="https://img.shields.io/npm/v/@eureka-studio/escape?label=npm&color=EC4537&labelColor=1C1717"></a>
  <a href="https://bundlejs.com/?q=@eureka-studio/escape"><img alt="bundle size" src="https://img.shields.io/bundlejs/size/@eureka-studio/escape?label=gzip&color=EC4537&labelColor=1C1717"></a>
  <a href="https://github.com/eureka-studio-hq/escape/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/eureka-studio-hq/escape/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@eureka-studio/escape"><img alt="downloads" src="https://img.shields.io/npm/dm/@eureka-studio/escape?color=EC4537&labelColor=1C1717"></a>
  <a href="./LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-EC4537?labelColor=1C1717"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-EC4537?labelColor=1C1717">
  <img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-EC4537?labelColor=1C1717">
</p>

# @eureka-studio/escape

Detect in-app browsers (X, Instagram, TikTok, Facebook, Snapchat, WhatsApp and more), fix what can be fixed, and give people a one-tap way out to Safari or Chrome.

When a link is opened from a social app it loads inside that app's embedded browser. There, Google sign-in is refused, WebGL contexts get dropped under memory pressure, storage is isolated from the real browser, audio stays muted, and the page cannot lock orientation. This package handles all of that in under 3 kB with no dependencies, and works with any framework or none.

```ts
import { detect, escape, guardWebGL } from '@eureka-studio/escape';

if (detect().inApp) {
  showButton('Open in Safari', () => escape({ medium: 'start' }));
}
guardWebGL(canvas, { onLost: () => pauseGame() });
```

Works with plain HTML, Vite, React, Vue, Svelte, Phaser, PixiJS, Three.js and any other browser code. See [`examples/`](./examples) for a no-build page, a Vite app and a React hook.

Running in production on [Danfo Run](https://danforun.com), where about a third of players arrive from X, Instagram or WhatsApp.

## Install

```sh
npm install @eureka-studio/escape
```

Or without a build step:

```html
<script src="https://unpkg.com/@eureka-studio/escape/dist/escape.global.js"></script>
<script>
  if (Escape.detect().inApp) {
    /* ... */
  }
</script>
```

## API

### `detect()`

```ts
const env = detect();
// { inApp: true, app: 'instagram', os: 'ios', confidence: 'high', outsideBrowser: 'Safari' }
```

Known apps are matched by user-agent tokens from [`data/apps.json`](./data/apps.json). Unlabeled WebViews are caught by heuristics and reported as `app: 'other'` with `confidence: 'medium'`. Safe on the server: returns `inApp: false`. The result is memoised per page.

### `capabilities()`

```ts
const caps = capabilities();
// { googleSignIn: false, webgl: 'fragile', audioAutoplay: false, fullscreen: false,
//   orientationLock: false, webShare: true, clipboard: true, storage: 'isolated',
//   pwaInstall: false, deepLinkOut: 'x-safari' }
```

Defaults come from the app table; feature detection overrides them where the browser exposes a signal. `canGoogleSignIn()` is a shortcut for the one most people need.

### `escape(options)`

Call from a user gesture. Opens the page (or `options.url`) in the system browser.

```ts
escape({
  url: 'https://example.com/play', // default: current page without its hash
  medium: 'signin', // lands in utm_medium and the analytics event
  params: { go: handoffCode }, // extra query parameters
  copyLink: true, // copy the link first, in case the app ignores the jump
  onStay: ({ copied }) => showHint(copied), // still here after ~1.6 s
});
```

- iOS: `x-safari-https://…` (iOS 17 and later)
- Android: a Chrome `intent://` link
- Elsewhere: a plain navigation in a new tab

`escapeTarget(options)` builds the same link without opening it, for an `<a href>` or a test.

### Fixes

```ts
unlockAudio(audioContext); // resume on first gesture and when the page returns
fixViewport(); // --escape-vh and safe-area custom properties on <html>
await lockLandscape(); // true if the lock took; false so you can show a hint
await share({ title, text, url, medium: 'score' }); // Web Share with per-app fallbacks
```

### `guardWebGL(canvas, { onLost, onRestored })`

Prevents the default on `webglcontextlost`, reports it, and tells you whether you are in-app so you can offer `escape()` instead of a frozen screen.

### `onEvent(listener)`

```ts
onEvent((name, data) => analytics.track(name, data));
```

| event                 | when                                           |
| --------------------- | ---------------------------------------------- |
| `inapp_detected`      | first detection on a page view inside an app   |
| `inapp_escape`        | `escape()` was called                          |
| `inapp_escape_stayed` | the page was still visible afterwards          |
| `handoff_claimed`     | progress was picked up in the system browser   |
| `gl_lost`             | the WebGL context was lost                     |
| `signin_blocked`      | sign-in was attempted where it cannot complete |

## Carrying progress across the jump

The in-app browser's storage is not Safari's or Chrome's, so a player who escapes would otherwise start from zero. Two companion packages handle it:

- [`@eureka-studio/escape-handoff`](./packages/handoff) — link mode (keys in the URL hash, no server) and code mode (park on a server, claim once in the system browser).
- [`@eureka-studio/escape-server`](./packages/server) — the matching handler for Cloudflare Workers (KV) and Vercel/Upstash, or any key-value store.

```ts
const handoff = createHandoff({ keys: 'game.', transport: fetchTransport('/api/handoff') });
await handoff.claim(); // on load, any browser
handoff.park(); // then, on the tap:
escape({ params: handoff.params() });
```

## Showing a card

[`@eureka-studio/escape-ui`](./packages/ui) is an optional 1.5 kB themeable "Open in Safari / Chrome" card, plus a "The game paused" card for a lost WebGL context.

```ts
import { showEscapeCard } from '@eureka-studio/escape-ui';
showEscapeCard({ copy: { title: 'Keep your progress' }, escape: { medium: 'start' } });
```

## Contributing

The two easiest contributions need no TypeScript:

- **A new app or a wrong capability:** edit [`data/apps.json`](./data/apps.json).
- **A misdetected user agent:** add a row to [`data/user-agents.json`](./data/user-agents.json) with the expected result. The test suite runs every row.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © Eureka Studios
