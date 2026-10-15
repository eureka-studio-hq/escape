import { describe, expect, it, vi } from 'vitest';
import { fixViewport, unlockAudio } from './fixes';

describe('unlockAudio', () => {
  it('resumes a suspended context on the first gesture', () => {
    const ctx = { state: 'suspended', resume: vi.fn(() => Promise.resolve()) };
    const off = unlockAudio(ctx);
    document.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    off();
    document.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });
});

describe('fixViewport', () => {
  it('writes the viewport custom properties on <html>', () => {
    const off = fixViewport();
    expect(document.documentElement.style.getPropertyValue('--escape-vh')).toMatch(/px$/);
    off();
  });
});
