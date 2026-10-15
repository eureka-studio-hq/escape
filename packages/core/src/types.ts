/** Operating system family, as far as the user agent tells us. */
export type OS = 'ios' | 'android' | 'other';

/** The app whose embedded browser we are in. `other` = an unlabeled WebView. */
export type AppId =
  | 'x'
  | 'instagram'
  | 'threads'
  | 'facebook'
  | 'messenger'
  | 'snapchat'
  | 'tiktok'
  | 'whatsapp'
  | 'telegram'
  | 'linkedin'
  | 'gmail'
  | 'pinterest'
  | 'other';

export type Confidence = 'high' | 'medium' | 'low';

export interface Environment {
  /** True when the page is running inside an app's embedded browser. */
  inApp: boolean;
  /** Which app, or null when not in an app. */
  app: AppId | null;
  os: OS;
  /** high = a known UA token matched; medium = WebView heuristics; low = nothing matched. */
  confidence: Confidence;
  /** Display name of the system browser the user would escape to. */
  outsideBrowser: 'Safari' | 'Chrome' | 'Browser';
}

export interface Capabilities {
  googleSignIn: boolean;
  webgl: 'ok' | 'fragile';
  audioAutoplay: boolean;
  fullscreen: boolean;
  orientationLock: boolean;
  webShare: boolean;
  clipboard: boolean;
  storage: 'shared' | 'isolated';
  pwaInstall: boolean;
  /** The mechanism escape() will use on this platform. */
  deepLinkOut: 'x-safari' | 'intent' | 'none';
}

/** Shape of one capability row in data/apps.json (before runtime feature detection). */
export type StaticCapabilities = Omit<Capabilities, 'webShare' | 'clipboard' | 'deepLinkOut'>;

export interface AppRow {
  id: AppId;
  name: string;
  tokens: string[];
  capabilities: { ios: StaticCapabilities; android: StaticCapabilities };
}
