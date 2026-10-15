export { detect, detectOS, matchApp, looksLikeWebView, resetDetect } from './detect';
export { capabilities, canGoogleSignIn } from './capabilities';
export { escape, escapeTarget } from './escape';
export type { EscapeOptions, EscapeTarget } from './escape';
export { unlockAudio, fixViewport, lockLandscape, share } from './fixes';
export type { ShareOptions, ShareResult } from './fixes';
export { onEvent } from './events';
export type { EscapeEvent, EventData, EventListener } from './events';
export type { Environment, AppId, OS, Confidence, Capabilities } from './types';
