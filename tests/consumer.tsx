import 'react-drift-rail/styles.css';
import { createRef } from 'react';
import { DraggableRail, type DraggableRailProps, type RailDragEndInfo } from 'react-drift-rail';
const ref = createRef<HTMLDivElement>();
const props: DraggableRailProps = {
  gap: '1rem',
  dir: 'rtl',
  'aria-label': 'Photos',
  onDragEnd: (event: RailDragEndInfo) => {
    const cancelled: boolean = event.cancelled;
    void cancelled;
  },
};
export const example = (
  <DraggableRail {...props} ref={ref}>
    <button>Custom child</button>
  </DraggableRail>
);
ref.current?.scrollBy({ left: 20 });
// @ts-expect-error gap must be a CSS length, not an object
export const invalid = <DraggableRail gap={{ px: 12 }} />;
