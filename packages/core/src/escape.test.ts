import { describe, expect, it } from 'vitest';
import { escapeTarget } from './escape';

const IOS_X =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/10.45';
const ANDROID_IG =
  'Mozilla/5.0 (Linux; Android 13; SM-A135F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0';
const DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';

describe('escapeTarget', () => {
  it('builds an x-safari link on iOS with utm tags', () => {
    const t = escapeTarget({ url: 'https://example.com/play', medium: 'signin' }, IOS_X);
    expect(t.scheme).toBe('x-safari');
    expect(t.url).toBe('https://example.com/play?utm_source=inapp&utm_medium=signin');
    expect(t.href).toBe('x-safari-https://example.com/play?utm_source=inapp&utm_medium=signin');
  });

  it('builds a Chrome intent on Android and keeps the query', () => {
    const t = escapeTarget(
      { url: 'https://example.com/play?level=3', params: { go: 'abc123' } },
      ANDROID_IG,
    );
    expect(t.scheme).toBe('intent');
    expect(t.href).toBe(
      'intent://example.com/play?level=3&go=abc123&utm_source=inapp&utm_medium=instagram#Intent;scheme=https;package=com.android.chrome;end',
    );
  });

  it('can switch utm off', () => {
    const t = escapeTarget({ url: 'https://example.com/', utm: false }, IOS_X);
    expect(t.url).toBe('https://example.com/');
  });

  it('falls back to a plain URL elsewhere', () => {
    const t = escapeTarget({ url: 'https://example.com/' }, DESKTOP);
    expect(t.scheme).toBe('none');
    expect(t.href).toBe(t.url);
  });
});
