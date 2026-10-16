import { detect, escape, onEvent } from '@eureka-studio/escape';
import { createHandoff, unpackFromLocation } from '@eureka-studio/escape-handoff';

// 1. In any browser: restore progress that travelled in the link (link mode).
const restored = unpackFromLocation();

// 2. Code mode, if you have a server: see @eureka-studio/escape-server for the handler.
const handoff = createHandoff({
  keys: 'demo.',
  transport: {
    put: async (code, payload) =>
      void (await fetch('/api/handoff', {
        method: 'POST',
        body: JSON.stringify({ code, payload }),
      })),
    take: async (code) => {
      const r = await fetch(`/api/handoff?code=${code}`);
      return r.ok ? ((await r.json()) as { payload: never }).payload : null;
    },
  },
});
void handoff.claim().then((r) => r && console.log('claimed', r));

localStorage.setItem('demo.score', String(Number(localStorage.getItem('demo.score') ?? 0) + 1));

const env = detect();
const status = document.getElementById('status')!;
const open = document.getElementById('open') as HTMLButtonElement;
status.textContent = env.inApp
  ? `Inside ${env.app} on ${env.os}. Restored ${restored} keys.`
  : 'Normal browser.';
onEvent((name, data) => console.log('[escape]', name, data));

if (env.inApp) {
  open.hidden = false;
  open.textContent = `Open in ${env.outsideBrowser}`;
  open.addEventListener('click', () => {
    handoff.park();
    escape({ medium: 'demo', params: handoff.params() });
  });
}
