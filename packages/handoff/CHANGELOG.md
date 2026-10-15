# @eureka-studio/escape-handoff

## 0.1.1

### Patch Changes

- 1e04172: `code()` keeps one code per page even when storage is blocked, so `park()` and `params()` always agree.
- Updated dependencies [8e82bb1]
  - @eureka-studio/escape@0.2.1

## 0.1.0

### Minor Changes

- 103ccf3: Add `escape-handoff` (link mode and code mode for carrying progress across the escape) and `escape-server` (Cloudflare KV and Upstash handlers). The core now exports `emit()` for companion packages.

### Patch Changes

- Updated dependencies [103ccf3]
  - @eureka-studio/escape@0.2.0
