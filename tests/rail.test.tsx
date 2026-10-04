import { createRef, StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraggableRail } from '../src';

function dimensions(element: HTMLElement) {
  Object.defineProperties(element, {
    scrollWidth: { configurable: true, value: 1200 },
    clientWidth: { configurable: true, value: 400 },
  });
  return element;
}
function setup(props: React.ComponentProps<typeof DraggableRail> = {}) {
  const result = render(
    <DraggableRail aria-label="Gallery" {...props}>
      <a href="#test">Link</a>
      <button>Action</button>
      <input aria-label="Text" />
    </DraggableRail>,
  );
  return { ...result, rail: dimensions(screen.getByRole('region', { name: 'Gallery' })) };
}
const pointer = { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
function down(target: Element) {
  fireEvent.pointerDown(target, { ...pointer, clientX: 250, clientY: 50 });
}
function move(x: number, y = 50) {
  fireEvent.pointerMove(document, { ...pointer, clientX: x, clientY: y });
}
function up() {
  fireEvent.pointerUp(document, { ...pointer, buttons: 0 });
}

describe('DraggableRail', () => {
  it('renders arbitrary children and forwards a native element ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { rail } = setup({ ref, gap: 24, className: 'custom' });
    expect(ref.current).toBe(rail);
    expect(rail).toHaveStyle({ gap: '24px' });
    expect(rail).toHaveClass('custom', 'drift-rail');
    expect(screen.getByRole('button')).toBeVisible();
    expect(rail).toHaveAttribute('tabindex', '0');
  });
  it('toggles hidden scrollbars without removing focus or scrolling', () => {
    const { rail, rerender } = setup({ hideScrollbar: true });
    expect(rail).toHaveAttribute('data-scrollbar-hidden');
    expect(rail).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(rail, { key: 'End' });
    expect(rail.scrollLeft).toBe(800);
    rerender(
      <DraggableRail aria-label="Gallery" hideScrollbar={false}>
        Content
      </DraggableRail>,
    );
    expect(rail).not.toHaveAttribute('data-scrollbar-hidden');
    expect(rail.scrollLeft).toBe(800);
    expect(rail).not.toHaveAttribute('hideScrollbar');
  });
  it('adds a landmark only when named and respects an explicit role', () => {
    const { rerender, container } = render(<DraggableRail>Content</DraggableRail>);
    expect(container.firstChild).not.toHaveAttribute('role');
    rerender(
      <DraggableRail aria-label="Items" role="group">
        Content
      </DraggableRail>,
    );
    expect(screen.getByRole('group')).toHaveAccessibleName('Items');
  });
  it('keeps clicks below the threshold and starts only once above it', () => {
    const start = vi.fn();
    const end = vi.fn();
    const { rail } = setup({ onDragStart: start, onDragEnd: end });
    down(screen.getByRole('link'));
    move(247);
    expect(start).not.toHaveBeenCalled();
    expect(rail.scrollLeft).toBe(0);
    move(220);
    move(190);
    expect(rail.scrollLeft).toBe(60);
    expect(start).toHaveBeenCalledTimes(1);
    expect(rail).toHaveAttribute('data-dragging');
    up();
    expect(end).toHaveBeenCalledWith({ pointerType: 'mouse', scrollLeft: 60, cancelled: false });
    expect(rail).not.toHaveAttribute('data-dragging');
  });
  it('suppresses the click after dragging but preserves keyboard activation and the next click', () => {
    const click = vi.fn();
    const { rail } = setup({ onClick: click });
    down(rail);
    move(180);
    up();
    fireEvent.click(screen.getByRole('link'), { detail: 1 });
    expect(click).not.toHaveBeenCalled();
    down(screen.getByRole('button'));
    up();
    fireEvent.click(screen.getByRole('button'), { detail: 1 });
    expect(click).toHaveBeenCalledTimes(1);
    down(rail);
    move(180);
    up();
    fireEvent.click(screen.getByRole('button'), { detail: 0 });
    expect(click).toHaveBeenCalledTimes(2);
  });
  it('does not suppress a new control click after pointer cancellation', () => {
    const click = vi.fn();
    const { rail } = setup({ onClick: click });
    down(rail);
    move(180);
    fireEvent.pointerCancel(document, pointer);
    const input = screen.getByRole('textbox');
    down(input);
    up();
    fireEvent.click(input, { detail: 1 });
    expect(click).toHaveBeenCalledTimes(1);
  });
  it('does not let an outer rail intercept a nested rail gesture', () => {
    render(
      <DraggableRail aria-label="Outer">
        <DraggableRail aria-label="Inner">
          <span>Nested item</span>
        </DraggableRail>
      </DraggableRail>,
    );
    const outer = dimensions(screen.getByRole('region', { name: 'Outer' }));
    const inner = dimensions(screen.getByRole('region', { name: 'Inner' }));
    down(inner);
    move(180);
    up();
    expect(inner.scrollLeft).toBe(70);
    expect(outer.scrollLeft).toBe(0);
  });
  it('honors a consumer veto in pointer capture', () => {
    const { rail } = setup({ onPointerDownCapture: (event) => event.preventDefault() });
    down(rail);
    move(100);
    expect(rail.scrollLeft).toBe(0);
  });
  it('cancels active dragging and does not move after pointercancel', () => {
    const end = vi.fn();
    const { rail } = setup({ onDragEnd: end });
    down(rail);
    move(200);
    fireEvent.pointerCancel(document, pointer);
    move(100);
    expect(rail.scrollLeft).toBe(50);
    expect(end).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
  });
  it('ends on lost capture or window blur', () => {
    const end = vi.fn();
    const { rail } = setup({ onDragEnd: end });
    down(rail);
    move(200);
    fireEvent.lostPointerCapture(rail, pointer);
    expect(end).toHaveBeenCalledTimes(1);
    down(rail);
    move(200);
    fireEvent(window, new Event('blur'));
    expect(end).toHaveBeenCalledTimes(2);
  });
  it('ignores other pointers and a secondary mouse button', () => {
    const { rail } = setup();
    fireEvent.pointerDown(rail, { ...pointer, button: 2 });
    move(100);
    expect(rail.scrollLeft).toBe(0);
    down(rail);
    fireEvent.pointerMove(document, { ...pointer, pointerId: 2, clientX: 100 });
    expect(rail.scrollLeft).toBe(0);
  });
  it('yields vertical gestures and native touch scrolling', () => {
    const start = vi.fn();
    const { rail } = setup({ onDragStart: start });
    down(rail);
    move(248, 90);
    move(100, 90);
    expect(start).not.toHaveBeenCalled();
    fireEvent.pointerDown(rail, { ...pointer, pointerType: 'touch', clientX: 250 });
    fireEvent.pointerMove(document, { ...pointer, pointerType: 'touch', clientX: 100 });
    expect(rail.scrollLeft).toBe(0);
  });
  it('supports pen input', () => {
    const start = vi.fn();
    const { rail } = setup({ onDragStart: start });
    fireEvent.pointerDown(rail, { ...pointer, pointerType: 'pen', clientX: 250, clientY: 50 });
    fireEvent.pointerMove(document, { ...pointer, pointerType: 'pen', clientX: 200, clientY: 50 });
    expect(start).toHaveBeenCalledWith({ pointerType: 'pen', scrollLeft: 0 });
    expect(rail.scrollLeft).toBe(50);
  });
  it('preserves editable controls and explicit drag opt-outs', () => {
    const { rail } = setup();
    down(screen.getByRole('textbox'));
    move(100);
    expect(rail.scrollLeft).toBe(0);
    screen.getByRole('button').setAttribute('data-rail-no-drag', '');
    down(screen.getByRole('button'));
    move(100);
    expect(rail.scrollLeft).toBe(0);
  });
  it('keeps native drag events available in opt-out areas', () => {
    setup();
    expect(fireEvent.dragStart(screen.getByRole('link'))).toBe(false);
    screen.getByRole('link').setAttribute('data-rail-no-drag', '');
    expect(fireEvent.dragStart(screen.getByRole('link'))).toBe(true);
  });
  it('uses keyboard navigation only on the rail itself', () => {
    const { rail } = setup();
    fireEvent.keyDown(rail, { key: 'ArrowRight' });
    expect(rail.scrollLeft).toBe(320);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Home' });
    expect(rail.scrollLeft).toBe(320);
    fireEvent.keyDown(rail, { key: 'End' });
    expect(rail.scrollLeft).toBe(800);
    fireEvent.keyDown(rail, { key: 'Home' });
    expect(rail.scrollLeft).toBe(0);
    fireEvent.keyDown(rail, { key: 'ArrowRight', ctrlKey: true });
    expect(rail.scrollLeft).toBe(0);
  });
  it('lets consumers override keyboard handling', () => {
    const { rail } = setup({ onKeyDown: (event) => event.preventDefault() });
    fireEvent.keyDown(rail, { key: 'End' });
    expect(rail.scrollLeft).toBe(0);
  });
  it('supports negative native scroll offsets in RTL', () => {
    const { rail } = setup({ dir: 'rtl', style: { direction: 'rtl' } });
    fireEvent.keyDown(rail, { key: 'End' });
    expect(rail.scrollLeft).toBe(-800);
    fireEvent.keyDown(rail, { key: 'Home' });
    down(rail);
    move(350);
    expect(rail.scrollLeft).toBe(-100);
    up();
    fireEvent.keyDown(rail, { key: 'ArrowRight' });
    expect(rail.scrollLeft).toBe(0);
  });
  it('keeps keyboard scrolling when custom dragging is disabled', () => {
    const { rail } = setup({ dragEnabled: false });
    down(rail);
    move(100);
    expect(rail.scrollLeft).toBe(0);
    fireEvent.keyDown(rail, { key: 'End' });
    expect(rail.scrollLeft).toBe(800);
  });
  it('removes listeners, releases capture, and clears styling when unmounted', () => {
    const { rail, unmount } = setup();
    down(rail);
    move(200);
    vi.spyOn(rail, 'hasPointerCapture').mockReturnValue(true);
    unmount();
    move(100);
    expect(rail.scrollLeft).toBe(50);
    expect(rail.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(rail).not.toHaveAttribute('data-dragging');
  });
  it('reads fresh callbacks without resetting an ongoing gesture', () => {
    const end = vi.fn();
    const { rail, rerender } = setup();
    down(rail);
    move(200);
    rerender(
      <DraggableRail aria-label="Gallery" onDragEnd={end}>
        New content
      </DraggableRail>,
    );
    move(150);
    up();
    expect(rail.scrollLeft).toBe(100);
    expect(end).toHaveBeenCalledTimes(1);
  });
  it('handles Strict Mode without duplicate listeners', () => {
    const end = vi.fn();
    render(
      <StrictMode>
        <DraggableRail aria-label="Strict" onDragEnd={end}>
          Items
        </DraggableRail>
      </StrictMode>,
    );
    const rail = dimensions(screen.getByRole('region'));
    down(rail);
    move(200);
    up();
    expect(end).toHaveBeenCalledTimes(1);
  });
  it('stops dragging if all buttons are released outside the window', () => {
    const end = vi.fn();
    const { rail } = setup({ onDragEnd: end });
    down(rail);
    move(200);
    fireEvent.pointerMove(document, { ...pointer, buttons: 0, clientX: 100 });
    expect(end).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
  });
  it('does not scroll a non-overflowing rail or swallow its keyboard events', () => {
    const { rail } = setup();
    Object.defineProperty(rail, 'scrollWidth', { value: 300 });
    down(rail);
    move(100);
    expect(rail.scrollLeft).toBe(0);
    expect(fireEvent.keyDown(rail, { key: 'ArrowRight' })).toBe(true);
  });
  it('continues momentum after release and cancels it on wheel input', () => {
    vi.useFakeTimers();
    const { rail } = setup({ momentum: true });
    down(rail);
    act(() => vi.advanceTimersByTime(20));
    move(200);
    up();
    act(() => vi.advanceTimersByTime(32));
    expect(rail.scrollLeft).toBeGreaterThan(50);
    fireEvent.wheel(rail);
    const stopped = rail.scrollLeft;
    act(() => vi.advanceTimersByTime(200));
    expect(rail.scrollLeft).toBe(stopped);
  });
  it('does not add momentum when reduced motion is requested', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ ...window.matchMedia(''), matches: true });
    vi.useFakeTimers();
    const { rail } = setup({ momentum: true });
    down(rail);
    act(() => vi.advanceTimersByTime(20));
    move(200);
    up();
    act(() => vi.advanceTimersByTime(200));
    expect(rail.scrollLeft).toBe(50);
  });
  it('does not add momentum after a stationary hold', () => {
    vi.useFakeTimers();
    const { rail } = setup({ momentum: true });
    down(rail);
    act(() => vi.advanceTimersByTime(20));
    move(200);
    act(() => vi.advanceTimersByTime(150));
    up();
    act(() => vi.advanceTimersByTime(200));
    expect(rail.scrollLeft).toBe(50);
  });
});
