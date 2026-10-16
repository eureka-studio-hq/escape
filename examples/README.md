# Examples

- `vanilla/` — one HTML file, two script tags from unpkg, no build step. Open it on a phone from a social app.
- `vite/` — TypeScript + Vite, link mode and code mode hand-off.
- `react/` — a 10-line `useEscape()` hook over the core. Vue, Svelte and Solid wrappers look the same.

Run one: `pnpm --filter example-vite dev` (or `example-react`). They build in CI so a core change cannot silently break a framework.
