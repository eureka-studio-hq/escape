import { beforeEach, describe, expect, it } from 'vitest';
import { packIntoUrl, readFromUrl, unpackFromLocation } from './link';
import { decode, encode } from './codec';

beforeEach(() => localStorage.clear());

describe('codec', () => {
  it('round-trips unicode', () => {
    const s = { 'g.name': 'Adé ✓ ₦2,500', 'g.best': '12' };
    expect(decode(encode(s))).toEqual(s);
  });
  it('rejects garbage', () => {
    expect(decode('not base64!!')).toBeNull();
  });
});

describe('link mode', () => {
  it('packs matching keys into the hash and unpacks them', () => {
    localStorage.setItem('game.best', '42');
    localStorage.setItem('game.coins', '1500');
    localStorage.setItem('other', 'ignored');
    const url = packIntoUrl('https://example.com/play?x=1#old', 'game.');
    expect(url.startsWith('https://example.com/play?x=1#mv=')).toBe(true);
    expect(readFromUrl(url)).toEqual({ 'game.best': '42', 'game.coins': '1500' });
  });

  it('leaves the url alone when nothing matches', () => {
    expect(packIntoUrl('https://example.com/', 'game.')).toBe('https://example.com/');
  });

  it('respects the size caps', () => {
    localStorage.setItem('game.big', 'x'.repeat(20_000));
    localStorage.setItem('game.small', 'ok');
    expect(readFromUrl(packIntoUrl('https://e.com/', 'game.'))).toEqual({ 'game.small': 'ok' });
  });

  it('restores from the current location and strips the hash', () => {
    localStorage.setItem('game.best', '7');
    const url = packIntoUrl('https://example.com/play', 'game.');
    localStorage.clear();
    window.history.replaceState(null, '', url.replace('https://example.com', ''));
    expect(unpackFromLocation()).toBe(1);
    expect(localStorage.getItem('game.best')).toBe('7');
    expect(window.location.hash).toBe('');
  });
});
