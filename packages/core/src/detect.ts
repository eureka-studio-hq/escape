import apps from '../../../data/apps.json';
import type { AppId, AppRow, Environment, OS } from './types';
import { hasNavigator, userAgent } from './env';

const rows = apps.apps as AppRow[];

export function detectOS(ua: string = userAgent()): OS {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ reports as a Mac with touch support.
  if (/Macintosh/i.test(ua) && hasNavigator() && (navigator.maxTouchPoints ?? 0) > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

/** Find a known app row by its UA tokens. First match in table order wins. */
export function matchApp(ua: string = userAgent()): AppRow | null {
  const lower = ua.toLowerCase();
  for (const row of rows) {
    for (const token of row.tokens) {
      if (lower.includes(token.toLowerCase())) return row;
    }
  }
  return null;
}

/** Heuristics for WebViews that do not label themselves. */
export function looksLikeWebView(ua: string = userAgent(), os: OS = detectOS(ua)): boolean {
  if (os === 'ios') {
    // Safari and the iOS browsers that reuse WebKit all carry "Safari/"; bare WKWebView does not.
    return /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  }
  if (os === 'android') {
    // Android System WebView adds "; wv)" and keeps the legacy "Version/x.x" token.
    return /;\s?wv\)/i.test(ua) || /Version\/\d[\d.]*\s.*Chrome\//i.test(ua);
  }
  return false;
}

let cached: Environment | null = null;

/**
 * Detect whether the page runs inside an app's embedded browser.
 * Safe to call anywhere; on the server it reports `inApp: false`.
 * The result is memoised for the page; pass `{ fresh: true }` to recompute.
 */
export function detect(options: { ua?: string; fresh?: boolean } = {}): Environment {
  if (!options.fresh && !options.ua && cached) return cached;
  const ua = options.ua ?? userAgent();
  const os = detectOS(ua);
  const outsideBrowser = os === 'ios' ? 'Safari' : os === 'android' ? 'Chrome' : 'Browser';

  let env: Environment;
  const row = ua ? matchApp(ua) : null;
  if (row) {
    env = { inApp: true, app: row.id as AppId, os, confidence: 'high', outsideBrowser };
  } else if (ua && looksLikeWebView(ua, os)) {
    env = { inApp: true, app: 'other', os, confidence: 'medium', outsideBrowser };
  } else {
    env = { inApp: false, app: null, os, confidence: ua ? 'high' : 'low', outsideBrowser };
  }
  if (!options.ua) cached = env;
  return env;
}

/** Test helper: forget the memoised result. */
export function resetDetect(): void {
  cached = null;
}
