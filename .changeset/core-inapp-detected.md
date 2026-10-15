---
'@eureka-studio/escape': patch
---

`detect()` emits `inapp_detected` once when the page is inside an app's browser, and `onEvent()` replays it to listeners that subscribe later.
