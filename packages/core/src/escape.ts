import { detect } from './detect';
import { emit } from './events';
import { hasDocument, hasNavigator, hasWindow } from './env';

export interface EscapeOptions {
  /** Where to open. Defaults to the current page without its hash. */
  url?: string;
  /** Free text that lands in `utm_medium` and the `inapp_escape` event (e.g. "signin", "boot_fail"). */
  medium?: string;
  /** Extra query parameters to append (e.g. a hand-off code). */
  params?: Record<string, string>;
  /** Append utm_source=inapp&utm_medium=<medium>. Default true. */
  utm?: boolean;
  /** Put the link on the clipboard first, in case the app ignores the jump. Default true. */
  copyLink?: boolean;
  /** Called if the page is still visible after `stayAfterMs` (the app ignored the jump). */
  onStay?: (info: { copied: boolean; url: string }) => void;
  /** How long to wait before deciding the jump did not happen. Default 1600 ms. */
  stayAfterMs?: number;
  /** Android: which browser package to target. Default Chrome. */
  androidPackage?: string;
}

export interface EscapeTarget {
  /** The plain https URL, as a system browser would open it. */
  url: string;
  /** What `location.href` is set to: an `x-safari-https://` link, an `intent://` link, or the URL itself. */
  href: string;
  scheme: 'x-safari' | 'intent' | 'none';
}

function withParams(url: string, params: Record<string, string>): string {
  const u = new URL(url, hasWindow() ? window.location.href : 'https://localhost/');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

/**
 * Build the link escape() would open, without opening it.
 * Useful for rendering an `<a href>` or for tests.
 */
export function escapeTarget(options: EscapeOptions = {}, ua?: string): EscapeTarget {
  const env = ua ? detect({ ua }) : detect();
  const base = options.url ?? (hasWindow() ? window.location.href.split('#')[0]! : '');
  const params: Record<string, string> = { ...(options.params ?? {}) };
  if (options.utm !== false) {
    params.utm_source = 'inapp';
    params.utm_medium = options.medium ?? env.app ?? 'escape';
  }
  const url = withParams(base, params);

  if (env.os === 'android') {
    const u = new URL(url);
    const pkg = options.androidPackage ?? 'com.android.chrome';
    const hostPath = `${u.host}${u.pathname}${u.search}`;
    return { url, href: `intent://${hostPath}#Intent;scheme=https;package=${pkg};end`, scheme: 'intent' };
  }
  if (env.os === 'ios') {
    return { url, href: `x-safari-${url}`, scheme: 'x-safari' };
  }
  return { url, href: url, scheme: 'none' };
}

/**
 * Open the current page (or `options.url`) in the system browser.
 * Call it from a user gesture such as a tap; browsers block scheme navigations otherwise.
 *
 * iOS: `x-safari-https://` (iOS 17+). Android: a Chrome `intent://`. Elsewhere: a plain navigation.
 * The link is copied to the clipboard first (unless `copyLink: false`), and `onStay` fires if the
 * page is still visible afterwards so you can tell the user the link is ready to paste.
 */
export function escape(options: EscapeOptions = {}): EscapeTarget {
  const env = detect();
  const target = escapeTarget(options);
  emit('inapp_escape', { medium: options.medium ?? null, app: env.app, os: env.os, scheme: target.scheme });

  if (!hasWindow()) return target;

  let copied = false;
  const copy =
    options.copyLink !== false && hasNavigator() && navigator.clipboard?.writeText
      ? navigator.clipboard.writeText(target.url).then(
          () => {
            copied = true;
          },
          () => {},
        )
      : Promise.resolve();

  if (target.scheme === 'intent') {
    window.location.href = target.href;
  } else if (target.scheme === 'x-safari') {
    // A short delay keeps the clipboard write inside the gesture's grace period.
    setTimeout(() => {
      window.location.href = target.href;
    }, 150);
  } else {
    window.open(target.href, '_blank', 'noopener');
  }

  const stayAfter = options.stayAfterMs ?? 1600;
  setTimeout(() => {
    if (hasDocument() && document.hidden) return;
    void copy.then(() => {
      emit('inapp_escape_stayed', { medium: options.medium ?? null, app: env.app, os: env.os, copied });
      options.onStay?.({ copied, url: target.url });
    });
  }, stayAfter);

  return target;
}
