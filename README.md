# @eureka/escape

Detect in-app browsers (X, Instagram, TikTok, Facebook, Snapchat, WhatsApp and more), fix what can be fixed, and give people a one-tap way out to Safari or Chrome.

When a link is opened from a social app it loads inside that app's embedded browser. There, Google sign-in is refused, WebGL contexts get dropped under memory pressure, storage is isolated from the real browser, audio stays muted, and the page cannot lock orientation. This package handles all of that in under 3 kB with no dependencies, and works with any framework or none.

```ts
import { detect, escape, guardWebGL } from '@eureka/escape';

if (detect().inApp) {
  showButton('Open in Safari', () => escape({ medium: 'start' }));
}
guardWebGL(canvas, { onLost: () => pauseGame() });
```

Works with plain HTML, Vite, React, Vue, Svelte, Phaser, PixiJS, Three.js and any other browser code.

## Install

```sh
npm install @eureka/escape
```

Or without a build step:

```html
<script src="https://unpkg.com/@eureka/escape/dist/escape.global.js"></script>
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

The in-app browser's storage is not Safari's or Chrome's. A `@eureka/escape-handoff` package with a link mode (no server) and a code mode (any server, two-method adapter) is next on the roadmap.

## Contributing

The two easiest contributions need no TypeScript:

- **A new app or a wrong capability:** edit [`data/apps.json`](./data/apps.json).
- **A misdetected user agent:** add a row to [`data/user-agents.json`](./data/user-agents.json) with the expected result. The test suite runs every row.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © Eureka Studios
