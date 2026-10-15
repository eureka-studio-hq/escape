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
  // detect() usually runs before any listener exists; replay the one event it would have sent
  if (detected) {
    try {
      listener('inapp_detected', detected);
    } catch {
      // ignore
    }
  }
  return () => listeners.delete(listener);
}

let detected: EventData | null = null;
/** @internal called once by detect() when the page is inside an app's browser */
export function markDetected(data: EventData): void {
  if (detected) return;
  detected = data;
  emit('inapp_detected', data);
}

/**
 * Emit an event on the shared bus. Meant for companion packages (handoff, ui); games
 * normally only subscribe with onEvent().
 */
export function emit(name: EscapeEvent, data: EventData = {}): void {
  for (const l of listeners) {
    try {
      l(name, data);
    } catch {
      // A broken analytics hook must never break the page.
    }
  }
}
