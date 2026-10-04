/** Native scrollLeft bounds in current evergreen browsers (negative for RTL). */
export function scrollBounds(width: number, viewport: number, rtl: boolean) {
  const extent = Math.max(0, width - viewport);
  return rtl ? { min: -extent, max: 0 } : { min: 0, max: extent };
}
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
/** Frame-rate independent exponential decay, with velocity in pixels/ms. */
export function momentumStep(velocity: number, elapsed: number) {
  const decay = Math.exp(-elapsed / 180);
  return { distance: velocity * 180 * (1 - decay), velocity: velocity * decay };
}
