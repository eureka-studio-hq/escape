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
