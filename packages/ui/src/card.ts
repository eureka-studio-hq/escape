import { detect, escape, type EscapeOptions } from '@eureka-studio/escape';

export interface CardCopy {
  /** Heading. Default: "Open in Safari" / "Open in Chrome". `{browser}` is replaced. */
  title?: string;
  /** One line under the heading. */
  text?: string;
  /** Primary button. Default "Open in {browser}". */
  open?: string;
  /** Secondary button. Default "Not now". Pass null to hide it. */
  dismiss?: string | null;
  /** Shown when the app ignored the jump and the link was copied. */
  copied?: string;
  /** Shown when the app ignored the jump and the link could not be copied. `{host}` is replaced. */
  stuck?: string;
}

export interface CardOptions {
  /** Where to mount. Default: document.body. */
  parent?: Element;
  /** Passed straight to escape(). */
  escape?: EscapeOptions;
  copy?: CardCopy;
  /** Called when the card is dismissed or the page is still here after the jump. */
  onClose?: (reason: 'dismiss' | 'stayed') => void;
  /** Show as a full-screen overlay (default) or an inline block. */
  overlay?: boolean;
}

export interface CardHandle {
  el: HTMLElement;
  close(): void;
}

const STYLE_ID = 'escape-ui-style';
const CSS = `
.esc-card{--esc-bg:#1c1717;--esc-fg:#f4f1ea;--esc-accent:#ec4537;--esc-accent-fg:#1c1717;--esc-radius:16px;--esc-font:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font:400 16px/1.35 var(--esc-font);color:var(--esc-fg);background:var(--esc-bg);border-radius:var(--esc-radius);padding:20px;max-width:360px;box-sizing:border-box;text-align:center}
.esc-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.6)}
.esc-card h2{margin:0 0 6px;font-size:22px;line-height:1.2;font-weight:700}
.esc-card p{margin:0 0 14px;opacity:.85}
.esc-card button{display:block;width:100%;box-sizing:border-box;padding:14px 16px;border:0;border-radius:999px;font:inherit;font-size:18px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.esc-card .esc-open{background:var(--esc-accent);color:var(--esc-accent-fg);font-weight:700}
.esc-card .esc-dismiss{background:none;color:var(--esc-fg);opacity:.75;margin-top:8px}
.esc-card .esc-note{margin:10px 0 0;font-size:14px;opacity:.85;min-height:1.2em}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

const fill = (s: string, v: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

/**
 * Show a card that offers to open the page in the system browser. Returns a handle to close it.
 * Does nothing (returns null) when the page is not inside an app's browser.
 */
export function showEscapeCard(options: CardOptions = {}): CardHandle | null {
  if (typeof document === 'undefined') return null;
  const env = detect();
  if (!env.inApp) return null;
  ensureStyle();
  const vars = { browser: env.outsideBrowser, host: location.host };
  const c = options.copy ?? {};
  const overlay = options.overlay !== false;

  const card = document.createElement('div');
  card.className = 'esc-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-live', 'polite');
  const h = document.createElement('h2');
  h.textContent = fill(c.title ?? 'Open in {browser}', vars);
  const p = document.createElement('p');
  p.textContent = fill(
    c.text ?? 'This app’s browser can lose your progress. {browser} keeps it.',
    vars,
  );
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'esc-open';
  open.textContent = fill(c.open ?? 'Open in {browser}', vars);
  const note = document.createElement('p');
  note.className = 'esc-note';
  card.append(h, p, open, note);

  let dismiss: HTMLButtonElement | null = null;
  if (c.dismiss !== null) {
    dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'esc-dismiss';
    dismiss.textContent = fill(c.dismiss ?? 'Not now', vars);
    card.append(dismiss);
  }

  const root = overlay ? document.createElement('div') : card;
  if (overlay) {
    root.className = 'esc-overlay';
    root.append(card);
  }
  (options.parent ?? document.body).append(root);

  const close = (reason: 'dismiss' | 'stayed') => {
    root.remove();
    options.onClose?.(reason);
  };
  dismiss?.addEventListener('click', () => close('dismiss'));
  open.addEventListener('click', () => {
    escape({
      ...(options.escape ?? {}),
      onStay: ({ copied, url }) => {
        note.textContent = copied
          ? fill(c.copied ?? 'Link copied. Paste it in {browser}.', vars)
          : fill(c.stuck ?? 'Open {host} in {browser}.', { ...vars, host: new URL(url).host });
        options.escape?.onStay?.({ copied, url });
      },
    });
  });

  return { el: root, close: () => close('dismiss') };
}

export interface LostCardOptions extends Omit<CardOptions, 'copy'> {
  copy?: CardCopy & { retry?: string };
  /** Called for "Carry on". Default: reload the page. */
  onRetry?: () => void;
}

/**
 * The card for a lost WebGL context: "Carry on" always; "Open in Safari/Chrome" only inside an app.
 * Pair it with guardWebGL() from the core.
 */
export function showLostCard(options: LostCardOptions = {}): CardHandle | null {
  if (typeof document === 'undefined') return null;
  ensureStyle();
  const env = detect();
  const vars = { browser: env.outsideBrowser, host: location.host };
  const c = options.copy ?? {};
  const retry = () => (options.onRetry ? options.onRetry() : location.reload());

  if (!env.inApp) {
    const card = document.createElement('div');
    card.className = 'esc-card';
    card.setAttribute('role', 'alertdialog');
    const h = document.createElement('h2');
    h.textContent = c.title ?? 'The game paused';
    const p = document.createElement('p');
    p.textContent = c.text ?? 'Your device needed the memory back for a moment.';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'esc-open';
    b.textContent = c.retry ?? 'Carry on';
    b.addEventListener('click', retry);
    card.append(h, p, b);
    const root = document.createElement('div');
    root.className = 'esc-overlay';
    root.append(card);
    (options.parent ?? document.body).append(root);
    return { el: root, close: () => root.remove() };
  }

  const handle = showEscapeCard({
    ...options,
    copy: {
      ...c,
      title: c.title ?? 'The game paused',
      text:
        c.text ?? fill('This app’s browser ran out of memory. {browser} runs it smoothly.', vars),
      dismiss: c.retry ?? 'Carry on',
    },
    onClose: (reason) => {
      if (reason === 'dismiss') retry();
      options.onClose?.(reason);
    },
  });
  return handle;
}
