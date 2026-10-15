import { apply, collect, type CollectOptions, type KeySelector, type Snapshot } from './storage';
import { decode, encode } from './codec';

const HASH_KEY = 'mv';

/**
 * Link mode: put the matching localStorage keys into a URL hash so the system browser
 * can restore them. No server involved. Returns the URL with `#mv=…` appended, or the
 * URL unchanged when there is nothing to carry.
 *
 * Practical on iOS only: Android's Chrome intent cannot carry a hash.
 */
export function packIntoUrl(url: string, keys: KeySelector, options: CollectOptions = {}): string {
  const snapshot = collect(keys, options);
  if (Object.keys(snapshot).length === 0) return url;
  const base = url.split('#')[0]!;
  return `${base}#${HASH_KEY}=${encode(snapshot)}`;
}

/** Read a `#mv=…` hash from a URL, if present. */
export function readFromUrl(url: string): Snapshot | null {
  const hash = url.split('#')[1];
  if (!hash) return null;
  const m = /(?:^|&)mv=([A-Za-z0-9_-]+)/.exec(hash);
  return m?.[1] ? decode(m[1]) : null;
}

/**
 * In the system browser: restore keys carried in the current page's hash, then remove the
 * hash from the address bar. Returns the number of keys written, or 0 when nothing was carried.
 */
export function unpackFromLocation(options: { keepExisting?: boolean } = {}): number {
  if (typeof window === 'undefined') return 0;
  const snapshot = readFromUrl(window.location.href);
  if (!snapshot) return 0;
  const n = apply(snapshot, options);
  try {
    const clean = window.location.href.split('#')[0]!;
    window.history.replaceState(window.history.state, '', clean);
  } catch {
    // ignore
  }
  return n;
}
