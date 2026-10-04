import { clamp, momentumStep, scrollBounds } from './math';

export interface RailDragInfo {
  readonly pointerType: 'mouse' | 'pen';
  /** Native scrollLeft; negative toward the end in RTL. */
  readonly scrollLeft: number;
}
export interface RailDragEndInfo extends RailDragInfo {
  readonly cancelled: boolean;
}
export interface ControllerOptions {
  momentum: boolean;
  onStart: (info: RailDragInfo) => void;
  onEnd: (info: RailDragEndInfo) => void;
}

const threshold = 6;
const ignored =
  'input,textarea,select,option,[contenteditable]:not([contenteditable="false"]),video[controls],audio[controls],[data-rail-no-drag],[draggable="true"]';

type Gesture = {
  id: number;
  kind: 'mouse' | 'pen';
  x: number;
  y: number;
  origin: number;
  lastTime: number;
  velocity: number;
  active: boolean;
  min: number;
  max: number;
};

/** DOM adapter: no React dependency and no browser access until attached. */
export function attachDragging(element: HTMLDivElement, options: ControllerOptions) {
  const doc = element.ownerDocument;
  const ownerWindow = doc.defaultView;
  if (!ownerWindow) return () => {};
  const view = ownerWindow;
  let gesture: Gesture | undefined;
  let animation = 0;
  let suppressClick = false;
  let clickTimer = 0;
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const stopMomentum = () => {
    view.cancelAnimationFrame(animation);
    animation = 0;
  };
  const bounds = () =>
    scrollBounds(
      element.scrollWidth,
      element.clientWidth,
      view.getComputedStyle(element).direction === 'rtl',
    );
  const skip = (target: EventTarget | null) => {
    if (!(target instanceof view.Element)) return true;
    return target.closest('[data-drift-rail]') !== element || !!target.closest(ignored);
  };
  function coast(velocity: number) {
    if (!options.momentum || motion.matches || Math.abs(velocity) < 0.02) return;
    let last = view.performance.now();
    const tick = (now: number) => {
      // Do not jump when a background tab resumes.
      const dt = Math.min(64, now - last);
      last = now;
      const step = momentumStep(velocity, dt);
      velocity = step.velocity;
      const { min, max } = bounds();
      const previous = element.scrollLeft;
      const next = clamp(previous + step.distance, min, max);
      element.scrollLeft = next;
      if (Math.abs(velocity) >= 0.02 && next > min && next < max) {
        animation = view.requestAnimationFrame(tick);
      } else {
        animation = 0;
      }
    };
    animation = view.requestAnimationFrame(tick);
  }
  function removeGestureListeners() {
    doc.removeEventListener('pointermove', move);
    doc.removeEventListener('pointerup', up);
    doc.removeEventListener('pointercancel', cancel);
  }
  function finish(cancelled: boolean, emit = true) {
    const current = gesture;
    if (!current) return;
    gesture = undefined;
    removeGestureListeners();
    delete element.dataset.dragging;
    if (element.hasPointerCapture?.(current.id)) element.releasePointerCapture(current.id);
    if (!current.active) return;
    if (emit)
      options.onEnd({ pointerType: current.kind, scrollLeft: element.scrollLeft, cancelled });
    if (!cancelled && view.performance.now() - current.lastTime < 100) coast(current.velocity);
    clickTimer = view.setTimeout(() => {
      suppressClick = false;
    }, 500);
  }
  function down(event: PointerEvent) {
    stopMomentum();
    if (!gesture) {
      view.clearTimeout(clickTimer);
      suppressClick = false;
    }
    // Touch belongs to native scrolling, including browser momentum and pinch zoom.
    if (event.pointerType === 'touch') {
      finish(true);
      suppressClick = false;
      return;
    }
    if (
      gesture ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.defaultPrevented ||
      skip(event.target)
    )
      return;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const { min, max } = bounds();
    if (max === min) return;
    gesture = {
      id: event.pointerId,
      kind: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      origin: clamp(element.scrollLeft, min, max),
      lastTime: view.performance.now(),
      velocity: 0,
      active: false,
      min,
      max,
    };
    doc.addEventListener('pointermove', move, { passive: false });
    doc.addEventListener('pointerup', up);
    doc.addEventListener('pointercancel', cancel);
  }
  function move(event: PointerEvent) {
    const current = gesture;
    if (!current || current.id !== event.pointerId) return;
    if (event.buttons === 0) {
      finish(true);
      return;
    }
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.active) {
      if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx)) {
        finish(true);
        return;
      }
      if (Math.abs(dx) < threshold) return;
      current.active = true;
      suppressClick = true;
      element.dataset.dragging = '';
      element.setPointerCapture?.(current.id);
      const selection = doc.getSelection();
      if (selection?.anchorNode && element.contains(selection.anchorNode))
        selection.removeAllRanges();
      options.onStart({ pointerType: current.kind, scrollLeft: element.scrollLeft });
    }
    event.preventDefault();
    const now = view.performance.now();
    const previous = element.scrollLeft;
    element.scrollLeft = clamp(current.origin - dx, current.min, current.max);
    current.velocity = clamp(
      (element.scrollLeft - previous) / Math.max(1, now - current.lastTime),
      -3,
      3,
    );
    current.lastTime = now;
  }
  function up(event: PointerEvent) {
    if (event.pointerId === gesture?.id) finish(false);
  }
  function cancel(event: PointerEvent) {
    if (event.pointerId === gesture?.id) finish(true);
  }
  function interrupt() {
    stopMomentum();
    finish(true);
  }
  function click(event: MouseEvent) {
    if (!suppressClick || event.detail === 0) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function nativeDrag(event: DragEvent) {
    if (!skip(event.target)) event.preventDefault();
  }
  function motionChange() {
    if (motion.matches) stopMomentum();
  }
  element.addEventListener('pointerdown', down);
  element.addEventListener('lostpointercapture', cancel);
  element.addEventListener('click', click, true);
  element.addEventListener('dragstart', nativeDrag);
  element.addEventListener('wheel', interrupt, { passive: true });
  element.addEventListener('keydown', interrupt);
  element.addEventListener('focusin', stopMomentum);
  view.addEventListener('blur', interrupt);
  doc.addEventListener('visibilitychange', interrupt);
  motion.addEventListener('change', motionChange);
  return () => {
    stopMomentum();
    finish(true, false);
    view.clearTimeout(clickTimer);
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('lostpointercapture', cancel);
    element.removeEventListener('click', click, true);
    element.removeEventListener('dragstart', nativeDrag);
    element.removeEventListener('wheel', interrupt);
    element.removeEventListener('keydown', interrupt);
    element.removeEventListener('focusin', stopMomentum);
    view.removeEventListener('blur', interrupt);
    doc.removeEventListener('visibilitychange', interrupt);
    motion.removeEventListener('change', motionChange);
  };
}
