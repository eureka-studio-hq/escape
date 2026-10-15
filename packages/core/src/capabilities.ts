import apps from '../../../data/apps.json';
import type { AppRow, Capabilities, OS, StaticCapabilities } from './types';
import { detect } from './detect';
import { hasDocument, hasNavigator } from './env';

const table = apps as unknown as {
  apps: AppRow[];
  unknownWebView: { ios: StaticCapabilities; android: StaticCapabilities };
  browser: { ios: StaticCapabilities; android: StaticCapabilities; other: StaticCapabilities };
};

function staticFor(app: string | null, inApp: boolean, os: OS): StaticCapabilities {
  if (!inApp) return table.browser[os];
  const osKey = os === 'ios' ? 'ios' : 'android';
  const row = app ? table.apps.find((r) => r.id === app) : undefined;
  return row ? row.capabilities[osKey] : table.unknownWebView[osKey];
}

/**
 * What this browser can and cannot do. Static defaults come from data/apps.json;
 * runtime feature detection overrides them where the browser exposes a signal.
 */
export function capabilities(ua?: string): Capabilities {
  const env = ua ? detect({ ua }) : detect();
  const base = staticFor(env.app, env.inApp, env.os);

  const nav = hasNavigator() ? navigator : undefined;
  const webShare = !!nav && typeof nav.share === 'function';
  const clipboard = !!nav && !!nav.clipboard && typeof nav.clipboard.writeText === 'function';

  let fullscreen = base.fullscreen;
  if (hasDocument()) {
    const d = document as Document & { webkitFullscreenEnabled?: boolean };
    if (typeof d.fullscreenEnabled === 'boolean') fullscreen = fullscreen && d.fullscreenEnabled;
    else if (typeof d.webkitFullscreenEnabled === 'boolean') fullscreen = fullscreen && d.webkitFullscreenEnabled;
  }

  let orientationLock = base.orientationLock;
  if (typeof screen !== 'undefined' && screen.orientation) {
    const o = screen.orientation as ScreenOrientation & { lock?: unknown };
    orientationLock = orientationLock && typeof o.lock === 'function';
  }

  const deepLinkOut: Capabilities['deepLinkOut'] = !env.inApp
    ? 'none'
    : env.os === 'ios'
      ? 'x-safari'
      : env.os === 'android'
        ? 'intent'
        : 'none';

  return { ...base, fullscreen, orientationLock, webShare, clipboard, deepLinkOut };
}

/** Convenience: can a Google OAuth flow complete in this browser? */
export function canGoogleSignIn(ua?: string): boolean {
  return capabilities(ua).googleSignIn;
}
