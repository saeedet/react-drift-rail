// Browser-test fixture for content whose width is unknown when the rail mounts.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DraggableRail } from 'react-drift-rail';
import 'react-drift-rail/styles.css';
function Fixture() {
  const [count, setCount] = useState(3);
  return (
    <main>
      <button onClick={() => setCount((value) => value + 1)}>Add item</button>
      <DraggableRail
        initialPosition="center"
        hideScrollbar
        aria-label="Position fixture"
        style={{ width: 400, maxWidth: 'calc(100vw - 32px)' }}
      >
        {Array.from({ length: count }, (_, index) => (
          <article key={index} style={{ width: 300, height: 100, background: '#a4b594' }}>
            Item {index + 1}
          </article>
        ))}
        <img src="/late-image.svg" alt="Delayed landscape" height={100} />
      </DraggableRail>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
