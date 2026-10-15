import { detect } from './detect';
import { emit } from './events';

export interface GuardWebGLOptions {
  /** Called when the context is lost. `inApp` tells you whether offering an escape makes sense. */
  onLost?: (info: { inApp: boolean }) => void;
  /** Called if the browser restores the context. */
  onRestored?: () => void;
}

/**
 * In-app browsers run on a tight memory budget and can drop a WebGL context mid-session.
 * This prevents the default (so the page can recover) and reports it, so the game can pause
 * and offer `escape()` instead of freezing silently. Returns a function that removes the listeners.
 */
export function guardWebGL(canvas: HTMLCanvasElement, options: GuardWebGLOptions = {}): () => void {
  const onLost = (e: Event) => {
    e.preventDefault();
    const env = detect();
    emit('gl_lost', { inApp: env.inApp, app: env.app, os: env.os });
    options.onLost?.({ inApp: env.inApp });
  };
  const onRestored = () => options.onRestored?.();
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost, false);
    canvas.removeEventListener('webglcontextrestored', onRestored, false);
  };
}
