# @eureka-studio/escape

## 0.2.1

### Patch Changes

- 8e82bb1: `detect()` emits `inapp_detected` once when the page is inside an app's browser, and `onEvent()` replays it to listeners that subscribe later.

## 0.2.0

### Minor Changes

- 103ccf3: Add `escape-handoff` (link mode and code mode for carrying progress across the escape) and `escape-server` (Cloudflare KV and Upstash handlers). The core now exports `emit()` for companion packages.

## 0.1.0

### Minor Changes

- Initial release: detect(), capabilities(), escape(), viewport/audio/share fixes, guardWebGL() and onEvent().
