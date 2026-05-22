/**
 * Timestamps Unix em segundos.
 */

export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
