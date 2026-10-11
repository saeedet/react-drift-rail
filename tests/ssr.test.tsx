// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { DraggableRail } from '../src';
it('imports and renders without browser globals', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(
    <DraggableRail aria-label="SSR gallery" initialPosition="center">
      <span>Server content</span>
    </DraggableRail>,
  );
  expect(html).toContain('Server content');
  expect(html).toContain('justify-content:safe center');
});
