import { describe, expect, it, vi } from 'vitest';
import { guardWebGL } from './webgl';
import { onEvent } from './events';

describe('guardWebGL', () => {
  it('prevents default, emits gl_lost and calls onLost', () => {
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const seen = vi.fn();
    const offEvent = onEvent(seen);
    const off = guardWebGL(canvas, { onLost });
    const ev = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledWith({ inApp: false });
    expect(seen).toHaveBeenCalledWith('gl_lost', expect.objectContaining({ inApp: false }));
    off();
    offEvent();
  });
});
