/** Small guards so nothing here throws on the server or in odd runtimes. */
export const hasWindow = (): boolean => typeof window !== 'undefined';
export const hasNavigator = (): boolean => typeof navigator !== 'undefined';
export const hasDocument = (): boolean => typeof document !== 'undefined';

export function userAgent(): string {
  return hasNavigator() ? navigator.userAgent || '' : '';
}
