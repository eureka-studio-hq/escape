import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onEvent } from '@eureka-studio/escape';
import { createHandoff, generateCode, type HandoffPayload, type Transport } from './code';

function memoryTransport(): Transport & { store: Map<string, HandoffPayload> } {
  const store = new Map<string, HandoffPayload>();
  return {
    store,
    async put(code, payload) {
      store.set(code, payload);
    },
    async take(code) {
      const p = store.get(code) ?? null;
      store.delete(code);
      return p;
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('generateCode', () => {
  it('is 12 chars of base36', () => {
    expect(generateCode()).toMatch(/^[a-z0-9]{12}$/);
  });
});

describe('code mode', () => {
  it('reuses one code per browser and exposes it as params', () => {
    const h = createHandoff({ keys: 'game.', transport: memoryTransport() });
    const c = h.code();
    expect(h.code()).toBe(c);
    expect(h.params()).toEqual({ go: c });
  });

  it('parks the snapshot and claims it once in the other browser', async () => {
    const t = memoryTransport();
    localStorage.setItem('game.best', '99');
    const h = createHandoff({ keys: 'game.', transport: t, extra: () => ({ name: 'Ade' }) });
    const c = await h.park();
    expect(t.store.get(c)?.snapshot).toEqual({ 'game.best': '99' });

    // "other browser": empty storage, code in the URL
    localStorage.clear();
    window.history.replaceState(null, '', `/play?go=${c}&x=1`);
    const seen = vi.fn();
    const off = onEvent(seen);
    const r = await createHandoff({ keys: 'game.', transport: t }).claim();
    off();
    expect(r?.written).toBe(1);
    expect(r?.payload.extra).toEqual({ name: 'Ade' });
    expect(localStorage.getItem('game.best')).toBe('99');
    expect(window.location.search).toBe('?x=1');
    expect(seen).toHaveBeenCalledWith('handoff_claimed', expect.objectContaining({ written: 1 }));
    // second claim finds nothing: the code was single-use
    window.history.replaceState(null, '', `/play?go=${c}`);
    expect(await createHandoff({ keys: 'game.', transport: t }).claim()).toBeNull();
  });

  it('retries while the park request is still in flight', async () => {
    const t = memoryTransport();
    const take = vi.spyOn(t, 'take');
    const h = createHandoff({ keys: 'game.', transport: t, claimRetryDelayMs: 1 });
    const c = h.code();
    window.history.replaceState(null, '', `/?go=${c}`);
    setTimeout(() => t.store.set(c, { v: 1, snapshot: { 'game.a': '1' } }), 2);
    const r = await h.claim();
    expect(r?.written).toBe(1);
    expect(take.mock.calls.length).toBeGreaterThan(1);
  });

  it('ignores malformed codes and leaves the page alone without one', async () => {
    const h = createHandoff({ keys: 'game.', transport: memoryTransport() });
    expect(await h.claim()).toBeNull();
    window.history.replaceState(null, '', '/?go=../etc');
    expect(await h.claim()).toBeNull();
  });

  it('can hand the payload back without touching storage', async () => {
    const t = memoryTransport();
    const c = generateCode();
    t.store.set(c, { v: 1, snapshot: { 'game.coins': '5' } });
    window.history.replaceState(null, '', `/?go=${c}`);
    const r = await createHandoff({ keys: 'game.', transport: t }).claim({ applySnapshot: false });
    expect(r?.written).toBe(0);
    expect(localStorage.getItem('game.coins')).toBeNull();
    expect(r?.payload.snapshot).toEqual({ 'game.coins': '5' });
  });
});

describe('code() without storage', () => {
  it('keeps one code for the page', () => {
    const h = createHandoff({ keys: 'game.', transport: memoryTransport(), codeKey: 'x.code' });
    const ls = window.localStorage;
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      const a = h.code();
      expect(h.code()).toBe(a);
      expect(h.params()).toEqual({ go: a });
    } finally {
      setItem.mockRestore();
      getItem.mockRestore();
      ls.clear();
    }
  });
});
