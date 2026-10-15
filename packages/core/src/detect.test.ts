import { describe, expect, it } from 'vitest';
import { detect, detectOS, looksLikeWebView } from './detect';

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IOS_X =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/10.45';
const IOS_IG =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const ANDROID_WV =
  'Mozilla/5.0 (Linux; Android 13; SM-A135F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36';
const IOS_WKWEBVIEW =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

describe('detectOS', () => {
  it('reads iOS and Android from the user agent', () => {
    expect(detectOS(IOS_SAFARI)).toBe('ios');
    expect(detectOS(ANDROID_CHROME)).toBe('android');
    expect(detectOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('other');
  });
});

describe('looksLikeWebView', () => {
  it('flags unlabeled WebViews only', () => {
    expect(looksLikeWebView(IOS_SAFARI)).toBe(false);
    expect(looksLikeWebView(IOS_WKWEBVIEW)).toBe(true);
    expect(looksLikeWebView(ANDROID_CHROME)).toBe(false);
    expect(looksLikeWebView(ANDROID_WV)).toBe(true);
  });
});

describe('detect', () => {
  it('reports system browsers as not in-app', () => {
    expect(detect({ ua: IOS_SAFARI })).toMatchObject({ inApp: false, app: null, os: 'ios', outsideBrowser: 'Safari' });
    expect(detect({ ua: ANDROID_CHROME })).toMatchObject({ inApp: false, app: null, os: 'android', outsideBrowser: 'Chrome' });
  });

  it('names known apps with high confidence', () => {
    expect(detect({ ua: IOS_X })).toMatchObject({ inApp: true, app: 'x', os: 'ios', confidence: 'high' });
    expect(detect({ ua: IOS_IG })).toMatchObject({ inApp: true, app: 'instagram', confidence: 'high' });
  });

  it('falls back to heuristics for unlabeled WebViews', () => {
    expect(detect({ ua: ANDROID_WV })).toMatchObject({ inApp: true, app: 'other', confidence: 'medium' });
    expect(detect({ ua: IOS_WKWEBVIEW })).toMatchObject({ inApp: true, app: 'other', confidence: 'medium' });
  });

  it('is safe without a user agent', () => {
    expect(detect({ ua: '' })).toMatchObject({ inApp: false, app: null, confidence: 'low' });
  });
});
