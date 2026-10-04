import { describe, expect, it } from 'vitest';
import { clamp, momentumStep, scrollBounds } from '../src/core/math';
describe('scroll math', () => {
  it('clamps overscroll and handles content smaller than its viewport', () => {
    expect(scrollBounds(100, 500, false)).toEqual({ min: 0, max: 0 });
    expect(scrollBounds(1000, 300, true)).toEqual({ min: -700, max: 0 });
    expect(clamp(-900, -700, 0)).toBe(-700);
  });
  it('decays consistently across frame rates', () => {
    const full = momentumStep(2, 32);
    const half = momentumStep(2, 16);
    const rest = momentumStep(half.velocity, 16);
    expect(full.distance).toBeCloseTo(half.distance + rest.distance, 8);
    expect(full.velocity).toBeCloseTo(rest.velocity, 8);
  });
});
