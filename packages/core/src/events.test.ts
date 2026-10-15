import { describe, expect, it, vi } from 'vitest';
import { emit, onEvent } from './events';

describe('events', () => {
  it('delivers to listeners and supports unsubscribe', () => {
    const spy = vi.fn();
    const off = onEvent(spy);
    emit('inapp_escape', { medium: 'test' });
    expect(spy).toHaveBeenCalledWith('inapp_escape', { medium: 'test' });
    off();
    emit('inapp_escape', { medium: 'again' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('isolates a throwing listener', () => {
    const bad = onEvent(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    onEvent(good);
    expect(() => emit('gl_lost')).not.toThrow();
    expect(good).toHaveBeenCalled();
    bad();
  });
});

describe('inapp_detected', () => {
  it('is replayed to listeners that subscribe after detection', async () => {
    const { markDetected } = await import('./events');
    markDetected({ app: 'x', os: 'ios', confidence: 'high' });
    const late = vi.fn();
    onEvent(late);
    expect(late).toHaveBeenCalledWith('inapp_detected', expect.objectContaining({ app: 'x' }));
  });
});
