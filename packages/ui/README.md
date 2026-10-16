# @eureka-studio/escape-ui

A small, themeable card for [`@eureka-studio/escape`](https://www.npmjs.com/package/@eureka-studio/escape): "Open in Safari / Chrome" with a one-tap escape, and a "The game paused" card for a lost WebGL context. Plain DOM, CSS variables, no framework. About 1.5 kB.

```sh
npm install @eureka-studio/escape @eureka-studio/escape-ui
```

```ts
import { showEscapeCard } from '@eureka-studio/escape-ui';

// renders nothing outside an in-app browser
showEscapeCard({
  copy: { title: 'Keep your progress', text: 'Open the game in {browser} so nothing gets lost.' },
  escape: { medium: 'start' },
  onClose: (reason) => console.log(reason), // 'dismiss' | 'stayed'
});
```

```ts
import { guardWebGL } from '@eureka-studio/escape';
import { showLostCard } from '@eureka-studio/escape-ui';

guardWebGL(canvas, { onLost: () => showLostCard({ onRetry: () => location.reload() }) });
```

## Theming

Override the custom properties on `.esc-card` (or on `:root`):

```css
.esc-card {
  --esc-bg: #14110f;
  --esc-fg: #fff6e0;
  --esc-accent: #ffd23d;
  --esc-accent-fg: #14110f;
  --esc-radius: 20px;
  --esc-font: 'Your Font', sans-serif;
}
```

`overlay: false` renders the card inline inside `parent` instead of a full-screen overlay.

## Copy

Every string is replaceable through `copy`; `{browser}` and `{host}` are filled in. Pass `dismiss: null` to remove the secondary button.

## License

MIT © Eureka Studios
