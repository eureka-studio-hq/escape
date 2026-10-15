export type EscapeEvent =
  | 'inapp_detected'
  | 'inapp_escape'
  | 'inapp_escape_stayed'
  | 'handoff_claimed'
  | 'gl_lost'
  | 'signin_blocked';

export type EventData = Record<string, string | number | boolean | null | undefined>;
export type EventListener = (name: EscapeEvent, data: EventData) => void;

const listeners = new Set<EventListener>();

/**
 * Subscribe to the package's analytics events and forward them to your own tracker
 * (GA4, PostHog, Plausible, anything). Returns an unsubscribe function.
 */
export function onEvent(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** @internal */
export function emit(name: EscapeEvent, data: EventData = {}): void {
  for (const l of listeners) {
    try {
      l(name, data);
    } catch {
      // A broken analytics hook must never break the page.
    }
  }
}
