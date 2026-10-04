import { scrollBounds } from './math';

export type InitialPosition = 'start' | 'center' | 'end';

/** Set the initial viewport without taking ownership of subsequent scrolling. */
export function attachInitialPosition(element: HTMLDivElement, position: InitialPosition) {
  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow || position === 'start') return () => {};
  const view = ownerWindow;
  let stopped = false;
  let applied = element.scrollLeft;

  function place() {
    if (stopped) return;
    const rtl = view.getComputedStyle(element).direction === 'rtl';
    const { min, max } = scrollBounds(element.scrollWidth, element.clientWidth, rtl);
    element.scrollLeft = position === 'center' ? (min + max) / 2 : rtl ? min : max;
    // Read back the browser's rounded/clamped value to recognize our own scroll event.
    applied = element.scrollLeft;
  }
  const resize =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(place) : undefined;
  function observeItems() {
    if (stopped) return;
    resize?.disconnect();
    resize?.observe(element);
    for (const child of element.children) resize?.observe(child);
    place();
  }
  const mutation = new view.MutationObserver(observeItems);
  function stop() {
    stopped = true;
    resize?.disconnect();
    mutation.disconnect();
    element.removeEventListener('pointerdown', stop, true);
    element.removeEventListener('wheel', stop, true);
    element.removeEventListener('keydown', stop, true);
    element.removeEventListener('scroll', onScroll);
  }
  function onScroll() {
    // Focus navigation and imperative scroll commands also end initial positioning.
    if (Math.abs(element.scrollLeft - applied) > 1) stop();
  }
  element.addEventListener('pointerdown', stop, { capture: true, passive: true });
  element.addEventListener('wheel', stop, { capture: true, passive: true });
  element.addEventListener('keydown', stop, true);
  element.addEventListener('scroll', onScroll, { passive: true });
  mutation.observe(element, { childList: true });
  observeItems();
  return stop;
}
