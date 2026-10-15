import { hasDocument, hasNavigator, hasWindow } from './env';
import { detect } from './detect';

/**
 * Resume a suspended AudioContext on the first user gesture and whenever the page
 * becomes visible again. In-app browsers suspend audio aggressively.
 * Returns a function that removes the listeners.
 */
export function unlockAudio(ctx: { state: string; resume(): Promise<void> }): () => void {
  if (!hasDocument()) return () => {};
  const resume = () => {
    if (ctx.state !== 'running') void ctx.resume().catch(() => {});
  };
  const gestures: (keyof DocumentEventMap)[] = ['pointerdown', 'touchend', 'keydown'];
  for (const g of gestures) document.addEventListener(g, resume, { passive: true });
  const onVisible = () => {
    if (!document.hidden) resume();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    for (const g of gestures) document.removeEventListener(g, resume);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/**
 * Keep a full-height layout correct when the in-app browser's toolbars move.
 * Sets `--escape-vh` (1% of the visible height, in px) and `--escape-safe-*`
 * custom properties on `<html>`, and updates them on resize and orientation change.
 * Returns a function that stops updating.
 */
export function fixViewport(): () => void {
  if (!hasWindow() || !hasDocument()) return () => {};
  const root = document.documentElement;
  const update = () => {
    const h = window.visualViewport?.height ?? window.innerHeight;
    root.style.setProperty('--escape-vh', `${h / 100}px`);
    root.style.setProperty('--escape-safe-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--escape-safe-bottom', 'env(safe-area-inset-bottom, 0px)');
  };
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  window.visualViewport?.addEventListener('resize', update);
  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('orientationchange', update);
    window.visualViewport?.removeEventListener('resize', update);
  };
}

/**
 * Try to lock the screen to landscape. Most in-app browsers refuse; the promise
 * resolves `false` so you can show your own "turn your phone" hint.
 */
export async function lockLandscape(): Promise<boolean> {
  if (typeof screen === 'undefined' || !screen.orientation) return false;
  const o = screen.orientation as ScreenOrientation & { lock?: (t: string) => Promise<void> };
  if (typeof o.lock !== 'function') return false;
  try {
    await o.lock('landscape');
    return true;
  } catch {
    return false;
  }
}

export interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
  /** Append utm_source=share&utm_medium=<medium>. */
  medium?: string;
}

export type ShareResult = { method: 'web-share' | 'x' | 'whatsapp' | 'copied' | 'none' };

/**
 * Share a link with the Web Share API where it works, with per-app fallbacks:
 * inside X open the tweet composer, inside WhatsApp open a chat, otherwise copy the link.
 */
export async function share(options: ShareOptions): Promise<ShareResult> {
  const url = options.medium ? withUtm(options.url, 'share', options.medium) : options.url;
  const text = options.text ?? options.title ?? '';

  if (hasNavigator() && typeof navigator.share === 'function') {
    try {
      const data: ShareData = { url };
      if (options.title) data.title = options.title;
      if (options.text) data.text = options.text;
      await navigator.share(data);
      return { method: 'web-share' };
    } catch {
      // user cancelled or the app refused; try the fallbacks
    }
  }
  if (!hasWindow()) return { method: 'none' };

  const env = detect();
  if (env.app === 'x') {
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener',
    );
    return { method: 'x' };
  }
  if (env.app === 'whatsapp') {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(`${text} ${url}`.trim())}`;
    return { method: 'whatsapp' };
  }
  if (hasNavigator() && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return { method: 'copied' };
    } catch {
      // fall through
    }
  }
  return { method: 'none' };
}

function withUtm(url: string, source: string, medium: string): string {
  const u = new URL(url, hasWindow() ? window.location.href : 'https://localhost/');
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  return u.toString();
}
