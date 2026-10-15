import { describe, expect, it } from 'vitest';
import { capabilities, canGoogleSignIn } from './capabilities';

const IOS_X =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/10.45';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const ANDROID_IG =
  'Mozilla/5.0 (Linux; Android 13; SM-A135F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0';

describe('capabilities', () => {
  it('reports the known limits of X on iOS', () => {
    const c = capabilities(IOS_X);
    expect(c.googleSignIn).toBe(false);
    expect(c.webgl).toBe('fragile');
    expect(c.storage).toBe('isolated');
    expect(c.deepLinkOut).toBe('x-safari');
  });

  it('uses the Android intent route inside Instagram', () => {
    expect(capabilities(ANDROID_IG).deepLinkOut).toBe('intent');
  });

  it('treats a system browser as fully capable with no deep link needed', () => {
    const c = capabilities(ANDROID_CHROME);
    expect(c.googleSignIn).toBe(true);
    expect(c.webgl).toBe('ok');
    expect(c.storage).toBe('shared');
    expect(c.deepLinkOut).toBe('none');
  });

  it('exposes canGoogleSignIn()', () => {
    expect(canGoogleSignIn(IOS_X)).toBe(false);
    expect(canGoogleSignIn(ANDROID_CHROME)).toBe(true);
  });
});
