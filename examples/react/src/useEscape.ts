import { useMemo } from 'react';
import { capabilities, detect, escape, type EscapeOptions } from '@eureka-studio/escape';

/** The whole binding. This is how small a framework wrapper over the core should be. */
export function useEscape() {
  return useMemo(() => {
    const env = detect();
    return { ...env, caps: capabilities(), escape: (o?: EscapeOptions) => escape(o) };
  }, []);
}
