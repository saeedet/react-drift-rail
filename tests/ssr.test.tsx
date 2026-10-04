// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { DraggableRail } from '../src';
it('imports and renders without browser globals', () => {
  expect(typeof window).toBe('undefined');
  expect(
    renderToString(
      <DraggableRail aria-label="SSR gallery">
        <span>Server content</span>
      </DraggableRail>,
    ),
  ).toContain('Server content');
});
