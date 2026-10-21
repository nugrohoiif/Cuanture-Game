/**
 * Require landscape on phones and touch tablets, without blocking a desktop
 * browser just because its window happens to be narrow or tall.
 */
export function isMobilePortrait(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const canMatch = typeof window.matchMedia === 'function';
  const coarsePointer = canMatch && window.matchMedia('(pointer: coarse)').matches;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const touchTablet =
    navigator.maxTouchPoints > 0 && Math.min(window.screen.width, window.screen.height) <= 1024;

  const portrait = canMatch
    ? window.matchMedia('(orientation: portrait)').matches
    : window.innerHeight > window.innerWidth;

  return (coarsePointer || mobileUserAgent || touchTablet) && portrait;
}
