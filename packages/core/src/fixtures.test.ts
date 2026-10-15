import { describe, expect, it } from 'vitest';
import fixtures from '../../../data/user-agents.json';
import { detect } from './detect';

describe('data/user-agents.json', () => {
  for (const f of fixtures.fixtures) {
    it(f.note, () => {
      expect(detect({ ua: f.ua })).toMatchObject(f.expect);
    });
  }
});
