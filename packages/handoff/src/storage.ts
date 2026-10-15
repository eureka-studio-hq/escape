/** A key filter: a prefix string, a list of keys, or a predicate. */
export type KeySelector = string | string[] | ((key: string) => boolean);

export function toPredicate(keys: KeySelector): (key: string) => boolean {
  if (typeof keys === 'function') return keys;
  if (Array.isArray(keys)) {
    const set = new Set(keys);
    return (k) => set.has(k);
  }
  return (k) => k.startsWith(keys);
}

export type Snapshot = Record<string, string>;

export interface CollectOptions {
  /** Skip any single value longer than this (default 16 000 chars). */
  maxValueLength?: number;
  /** Stop adding once the snapshot reaches this many chars (default 60 000). */
  maxTotalLength?: number;
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // some in-app browsers throw on access
  }
}

/** Read the matching localStorage keys into a plain object, within size caps. */
export function collect(keys: KeySelector, options: CollectOptions = {}): Snapshot {
  const out: Snapshot = {};
  const ls = storage();
  if (!ls) return out;
  const match = toPredicate(keys);
  const maxValue = options.maxValueLength ?? 16_000;
  const maxTotal = options.maxTotalLength ?? 60_000;
  let total = 0;
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (!k || !match(k)) continue;
    const v = ls.getItem(k);
    if (v == null || v.length > maxValue || total + v.length + k.length > maxTotal) continue;
    out[k] = v;
    total += v.length + k.length;
  }
  return out;
}

/** Write a snapshot into localStorage. Existing keys are overwritten unless `keepExisting` is set. */
export function apply(snapshot: Snapshot, options: { keepExisting?: boolean } = {}): number {
  const ls = storage();
  if (!ls) return 0;
  let n = 0;
  for (const [k, v] of Object.entries(snapshot)) {
    if (options.keepExisting && ls.getItem(k) != null) continue;
    try {
      ls.setItem(k, v);
      n++;
    } catch {
      // quota or privacy mode: skip this key
    }
  }
  return n;
}
