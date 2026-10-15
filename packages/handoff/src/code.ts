import { emit } from '@eureka-studio/escape';
import { apply, collect, type CollectOptions, type KeySelector, type Snapshot } from './storage';

/** What the game ships to the server alongside the snapshot (optional, opaque to the package). */
export type Extra = Record<string, unknown>;

export interface HandoffPayload {
  /** Protocol version. */
  v: 1;
  /** localStorage snapshot. */
  snapshot: Snapshot;
  /** Anything else the game wants to carry (a device id, a display name…). */
  extra?: Extra;
}

/**
 * The two calls a game provides. `put` stores a payload under a code for a short time;
 * `take` returns it once and deletes it (null when missing or already taken).
 * See @eureka-studio/escape-server for ready-made handlers.
 */
export interface Transport {
  put(code: string, payload: HandoffPayload): Promise<void>;
  take(code: string): Promise<HandoffPayload | null>;
}

export interface HandoffOptions extends CollectOptions {
  /** Which localStorage keys to carry. */
  keys: KeySelector;
  transport: Transport;
  /** Query parameter that carries the code. Default "go". */
  param?: string;
  /** Where the code is remembered so the same in-app browser reuses it. Default "escape.handoff.code". */
  codeKey?: string;
  /** Extra data to send along with the snapshot. */
  extra?: () => Extra | undefined;
  /** Retries for claim() while the park request may still be in flight. Default 3, 1200 ms apart. */
  claimRetries?: number;
  claimRetryDelayMs?: number;
}

export interface ClaimResult {
  payload: HandoffPayload;
  /** How many keys were written to localStorage (0 when `applySnapshot: false`). */
  written: number;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CODE_RE = /^[a-z0-9]{12}$/;

export function generateCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % 36];
  return s;
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Code mode: park the snapshot on a server under a short random code, carry the code in the
 * URL, and claim it once in the system browser. Works on iOS and Android.
 */
export function createHandoff(options: HandoffOptions) {
  const param = options.param ?? 'go';
  const codeKey = options.codeKey ?? 'escape.handoff.code';

  function code(): string {
    const ls = storage();
    let c = ls?.getItem(codeKey) ?? null;
    if (!c || !CODE_RE.test(c)) {
      c = generateCode();
      try {
        ls?.setItem(codeKey, c);
      } catch {
        // ignore
      }
    }
    return c;
  }

  return {
    /** The code this browser will hand off under. Stable per in-app browser. */
    code,

    /** `{ [param]: code }`, ready to pass as `params` to escape(). */
    params(): Record<string, string> {
      return { [param]: code() };
    },

    /**
     * Store this browser's progress on the server. Fire-and-forget: call it right before
     * escape(); if it fails, the link still opens the game, just without the progress.
     */
    async park(): Promise<string> {
      const c = code();
      const payload: HandoffPayload = { v: 1, snapshot: collect(options.keys, options) };
      const extra = options.extra?.();
      if (extra) payload.extra = extra;
      try {
        await options.transport.put(c, payload);
      } catch {
        // best effort
      }
      return c;
    },

    /**
     * In the system browser: if the URL carries a code, fetch the payload once, write the
     * snapshot into localStorage (unless `applySnapshot: false`), strip the parameter from
     * the address bar, and return the payload for the game's own merge logic.
     */
    async claim(
      opts: { applySnapshot?: boolean; keepExisting?: boolean } = {},
    ): Promise<ClaimResult | null> {
      if (typeof window === 'undefined') return null;
      const url = new URL(window.location.href);
      const c = url.searchParams.get(param);
      if (!c) return null;
      url.searchParams.delete(param);
      try {
        window.history.replaceState(window.history.state, '', url.toString());
      } catch {
        // ignore
      }
      if (!CODE_RE.test(c)) return null;

      const retries = options.claimRetries ?? 3;
      const delay = options.claimRetryDelayMs ?? 1200;
      let payload: HandoffPayload | null = null;
      for (let i = 0; i < retries && !payload; i++) {
        try {
          payload = await options.transport.take(c);
        } catch {
          // offline or 5xx: try again
        }
        if (!payload && i < retries - 1) await new Promise((r) => setTimeout(r, delay));
      }
      if (!payload) return null;

      const written =
        opts.applySnapshot === false
          ? 0
          : apply(payload.snapshot, { keepExisting: opts.keepExisting ?? false });
      emit('handoff_claimed', { written, keys: Object.keys(payload.snapshot).length });
      return { payload, written };
    },
  };
}

export type Handoff = ReturnType<typeof createHandoff>;
