# Contributing

Thanks for helping. This project is deliberately small; most contributions are a few lines.

## Quick start

```sh
pnpm install
pnpm test        # unit tests and the user-agent fixture suite
pnpm lint        # eslint + prettier
pnpm typecheck
pnpm build
pnpm size        # core must stay under 3 kB
```

## The easy ones

**Add or correct an app.** Edit `data/apps.json`. Each row has an `id`, a display `name`, the user-agent `tokens` that identify it, and a capabilities block per OS. Then add at least one real user agent for it to `data/user-agents.json` with the expected result.

**Report a misdetection.** Open an issue with the user agent string and what `detect()` should return, or send a PR that adds the row to `data/user-agents.json`. The test suite will fail until detection is right.

## Code changes

- Keep the core free of framework imports and of `document.createElement`. UI lives in its own package.
- Nothing may run at import time. Everything must be safe when `window` is undefined.
- Add a test next to the file you change.
- Run `pnpm changeset` and describe the change in one line a user would understand.
- Small, focused commits with conventional messages (`feat(core): …`, `fix: …`, `docs: …`, `test: …`).

## Pull requests

CI runs lint, typecheck, tests, build and the size check. A PR that only touches `data/` can be merged by any maintainer once CI is green.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Releasing (maintainers)

```sh
pnpm changeset                 # describe the change, pick the bump
pnpm changeset version         # bumps versions and changelogs
git add -A && git commit -m "chore: release <packages and versions>"
pnpm build
(cd packages/core    && pnpm publish --access public --no-git-checks)
(cd packages/handoff && pnpm publish --access public --no-git-checks)
(cd packages/server  && pnpm publish --access public --no-git-checks)
pnpm changeset tag && git push && git push --tags
```

Always `pnpm publish`, never `npm publish`: pnpm rewrites `workspace:` dependency ranges to real versions at publish time; npm ships them as-is and the package becomes uninstallable. Publish the core before anything that depends on it.
