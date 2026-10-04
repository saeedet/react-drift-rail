import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { attachDragging, type RailDragInfo, type RailDragEndInfo } from './core/controller';
import { clamp, scrollBounds } from './core/math';
import { attachInitialPosition, type InitialPosition } from './core/initial-position';

export interface DraggableRailProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onDragStart' | 'onDragEnd'
> {
  /** Reading-order initial viewport. Read once on mount. Default: 'start'. */
  initialPosition?: InitialPosition;
  /** Hide native scrollbars while retaining all scrolling behavior. Default: false. */
  hideScrollbar?: boolean;
  /** Item spacing; numbers are pixels. Default: 16. */
  gap?: CSSProperties['gap'];
  /** Disable custom pointer dragging; native scrolling and keyboard remain. */
  dragEnabled?: boolean;
  /** Mouse/pen inertia; native touch momentum is unaffected. Default: false. */
  momentum?: boolean;
  onDragStart?: (info: RailDragInfo) => void;
  onDragEnd?: (info: RailDragEndInfo) => void;
}

export const DraggableRail = forwardRef<HTMLDivElement, DraggableRailProps>(function DraggableRail(
  {
    children,
    initialPosition = 'start',
    hideScrollbar = false,
    gap = 16,
    dragEnabled = true,
    momentum = false,
    onDragStart,
    onDragEnd,
    className,
    style,
    onKeyDown,
    tabIndex = 0,
    role,
    ...props
  },
  forwardedRef,
) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const initial = useRef(initialPosition);
  const cleanupPosition = useRef<(() => void) | undefined>(undefined);
  const setElement = useCallback((element: HTMLDivElement | null) => {
    cleanupPosition.current?.();
    cleanupPosition.current = undefined;
    elementRef.current = element;
    if (element) cleanupPosition.current = attachInitialPosition(element, initial.current);
  }, []);
  const callbacks = useRef({ onDragStart, onDragEnd });
  useEffect(() => {
    callbacks.current = { onDragStart, onDragEnd };
  });
  useImperativeHandle(forwardedRef, () => elementRef.current!, []);
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !dragEnabled) return;
    return attachDragging(element, {
      momentum,
      onStart: (info) => callbacks.current.onDragStart?.(info),
      onEnd: (info) => callbacks.current.onDragEnd?.(info),
    });
  }, [dragEnabled, momentum]);
  const named = Boolean(props['aria-label'] || props['aria-labelledby']);
  return (
    <div
      {...props}
      ref={setElement}
      role={role ?? (named ? 'region' : undefined)}
      tabIndex={tabIndex}
      className={['drift-rail', className].filter(Boolean).join(' ')}
      data-drift-rail=""
      data-scrollbar-hidden={hideScrollbar ? '' : undefined}
      data-drag-enabled={dragEnabled ? '' : undefined}
      style={{ gap, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          event.target !== event.currentTarget ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        const element = event.currentTarget;
        const rtl =
          element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
        const { min, max } = scrollBounds(element.scrollWidth, element.clientWidth, rtl);
        const step = element.clientWidth * 0.8;
        let next: number;
        switch (event.key) {
          case 'ArrowLeft':
            next = element.scrollLeft - step;
            break;
          case 'ArrowRight':
            next = element.scrollLeft + step;
            break;
          case 'Home':
            next = rtl ? max : min;
            break;
          case 'End':
            next = rtl ? min : max;
            break;
          default:
            return;
        }
        if (min === max) return;
        event.preventDefault();
        element.scrollLeft = clamp(next, min, max);
      }}
    >
      {children}
    </div>
  );
});
