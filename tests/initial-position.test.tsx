import { createRef, StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DraggableRail } from '../src';

const originalResizeObserver = window.ResizeObserver;
let resize: () => void;
let disconnect = vi.fn<() => void>();
let width = 1200;
beforeEach(() => {
  width = 1200;
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
  disconnect = vi.fn();
  window.ResizeObserver = class implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      resize = () => callback([], this);
    }
    observe() {}
    unobserve() {}
    disconnect = disconnect;
  };
});
afterEach(() => {
  window.ResizeObserver = originalResizeObserver;
});

describe('initial position', () => {
  it.each([
    ['start', 'ltr', 0],
    ['center', 'ltr', 400],
    ['end', 'ltr', 800],
    ['start', 'rtl', 0],
    ['center', 'rtl', -400],
    ['end', 'rtl', -800],
  ] as const)('places %s in %s before exposing the ref', (initialPosition, direction, expected) => {
    const ref = createRef<HTMLDivElement>();
    render(
      <DraggableRail ref={ref} initialPosition={initialPosition} style={{ direction }}>
        Items
      </DraggableRail>,
    );
    expect(ref.current?.scrollLeft).toBe(expected);
  });
  it('repositions for late layout until the first pointer intent', () => {
    render(
      <DraggableRail initialPosition="center" aria-label="Items">
        Content
      </DraggableRail>,
    );
    const rail = screen.getByRole('region');
    width = 1600;
    act(() => resize());
    expect(rail.scrollLeft).toBe(600);
    fireEvent.pointerDown(rail, { pointerType: 'touch' });
    width = 2000;
    act(() => resize());
    expect(rail.scrollLeft).toBe(600);
    expect(disconnect).toHaveBeenCalled();
  });
  it.each(['wheel', 'keydown', 'scroll'] as const)('stops repositioning after %s', (event) => {
    render(
      <DraggableRail initialPosition="center" aria-label="Items">
        Content
      </DraggableRail>,
    );
    const rail = screen.getByRole('region');
    if (event === 'scroll') rail.scrollLeft = 200;
    fireEvent(rail, new Event(event));
    const before = rail.scrollLeft;
    width = 2000;
    act(() => resize());
    expect(rail.scrollLeft).toBe(before);
  });
  it('does not mistake its own scroll notification for user movement', () => {
    render(
      <DraggableRail initialPosition="center" aria-label="Items">
        Content
      </DraggableRail>,
    );
    const rail = screen.getByRole('region');
    fireEvent.scroll(rail);
    width = 1600;
    act(() => resize());
    expect(rail.scrollLeft).toBe(600);
  });
  it('handles initially non-overflowing content and new children', async () => {
    width = 200;
    const { rerender } = render(<DraggableRail initialPosition="center" aria-label="Items" />);
    const rail = screen.getByRole('region');
    expect(rail.scrollLeft).toBe(0);
    width = 1200;
    await act(async () => {
      rerender(
        <DraggableRail initialPosition="center" aria-label="Items">
          <span>Loaded</span>
        </DraggableRail>,
      );
    });
    expect(rail.scrollLeft).toBe(400);
  });
  it('does not reset for prop changes but does reset on remount', () => {
    const { rerender } = render(
      <DraggableRail initialPosition="center" aria-label="Items">
        Content
      </DraggableRail>,
    );
    const rail = screen.getByRole('region');
    rerender(
      <DraggableRail initialPosition="end" aria-label="Items">
        Content
      </DraggableRail>,
    );
    expect(rail.scrollLeft).toBe(400);
    rerender(
      <DraggableRail key="fresh" initialPosition="end" aria-label="Items">
        Content
      </DraggableRail>,
    );
    expect(screen.getByRole('region').scrollLeft).toBe(800);
  });
  it('cleans observers on unmount and remains safe in Strict Mode', () => {
    const { unmount } = render(
      <StrictMode>
        <DraggableRail initialPosition="center" aria-label="Items">
          Content
        </DraggableRail>
      </StrictMode>,
    );
    const rail = screen.getByRole('region');
    expect(rail.scrollLeft).toBe(400);
    unmount();
    width = 2000;
    act(() => resize());
    expect(rail.scrollLeft).toBe(400);
    expect(disconnect).toHaveBeenCalled();
  });
});
