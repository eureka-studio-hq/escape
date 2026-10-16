import { afterEach, describe, expect, it, vi } from 'vitest';
import { showEscapeCard, showLostCard } from './card';
import { detect, resetDetect } from '@eureka-studio/escape';

const X_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/10.45';

function withUA(ua: string) {
  resetDetect();
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
  detect({ fresh: true });
}

afterEach(() => {
  document.body.innerHTML = '';
  resetDetect();
});

describe('showEscapeCard', () => {
  it('renders nothing in a normal browser', () => {
    withUA(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1',
    );
    expect(showEscapeCard()).toBeNull();
    expect(document.querySelector('.esc-card')).toBeNull();
  });

  it('renders the browser name and closes on dismiss', () => {
    withUA(X_UA);
    const onClose = vi.fn();
    const h = showEscapeCard({ onClose });
    expect(h).not.toBeNull();
    expect(document.querySelector('.esc-card h2')?.textContent).toBe('Open in Safari');
    expect(document.querySelector('.esc-open')?.textContent).toBe('Open in Safari');
    (document.querySelector('.esc-dismiss') as HTMLButtonElement).click();
    expect(document.querySelector('.esc-card')).toBeNull();
    expect(onClose).toHaveBeenCalledWith('dismiss');
  });

  it('accepts custom copy and hides dismiss when null', () => {
    withUA(X_UA);
    showEscapeCard({
      copy: { title: 'Keep your streak', open: 'Go to {browser}', dismiss: null },
      overlay: false,
    });
    expect(document.querySelector('.esc-overlay')).toBeNull();
    expect(document.querySelector('h2')?.textContent).toBe('Keep your streak');
    expect(document.querySelector('.esc-open')?.textContent).toBe('Go to Safari');
    expect(document.querySelector('.esc-dismiss')).toBeNull();
  });
});

describe('showLostCard', () => {
  it('offers only Carry on outside an app', () => {
    withUA(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36',
    );
    const onRetry = vi.fn();
    showLostCard({ onRetry });
    expect(document.querySelector('.esc-dismiss')).toBeNull();
    (document.querySelector('.esc-open') as HTMLButtonElement).click();
    expect(onRetry).toHaveBeenCalled();
  });

  it('offers the escape inside an app', () => {
    withUA(X_UA);
    showLostCard();
    expect(document.querySelector('.esc-open')?.textContent).toBe('Open in Safari');
    expect(document.querySelector('.esc-dismiss')?.textContent).toBe('Carry on');
  });
});
