import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DraggableRail } from 'react-drift-rail';
import 'react-drift-rail/styles.css';
import './styles.css';

const scenes = [
  ['alpine', 'Alpine quiet', '01 / HIGH COUNTRY'],
  ['coast', 'The long way home', '02 / COASTLINE'],
  ['dunes', 'A softer horizon', '03 / OPEN DESERT'],
  ['forest', 'Into the green', '04 / SLOW MORNINGS'],
  ['town', 'Afternoon light', '05 / OLD TOWN'],
  ['lake', 'Still, for a moment', '06 / NORTHBOUND'],
] as const;

function App() {
  const rail = useRef<HTMLDivElement>(null);
  const [gap, setGap] = useState(28);
  const [initialPosition, setInitialPosition] = useState<'start' | 'center' | 'end'>('center');
  const [tilted, setTilted] = useState(false);
  const [hideScrollbar, setHideScrollbar] = useState(true);
  const [momentum, setMomentum] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [rtl, setRtl] = useState(false);
  const [varied, setVaried] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState(0);
  return (
    <>
      <header className="topbar shell">
        <a className="brand" href="#">
          <span aria-hidden="true" className="brand-mark">
            ↔
          </span>{' '}
          drift rail<span className="version">v0.1</span>
        </a>
        <nav aria-label="Main">
          <a href="https://github.com/saeedet/react-drift-rail">GitHub</a>
          <a href="#usage">
            Get started <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main>
        <section className="intro shell">
          <p className="eyebrow">
            <span className="status-dot" /> A LITTLE ROOM TO EXPLORE
          </p>
          <h1>
            Let your content
            <br />
            <span>find its flow.</span>
          </h1>
          <div className="intro-bottom">
            <p>
              A lightweight, draggable rail for React.
              <br />
              Native scrolling. Your content. A natural feel.
            </p>
            <a href="#playground" className="text-link">
              Take it for a spin <span aria-hidden="true">↘</span>
            </a>
          </div>
        </section>
        <section className="playground" id="playground" aria-labelledby="playground-title">
          <div className="rail-heading shell">
            <h2 id="playground-title">A collection of somewhere</h2>
            <span className="drag-hint">
              {dragging ? 'Keep exploring' : 'Grab, drag, discover'}{' '}
              <span aria-hidden="true">↔</span>
            </span>
          </div>
          <DraggableRail
            key={`${initialPosition}-${rtl}`}
            ref={rail}
            initialPosition={initialPosition}
            hideScrollbar={hideScrollbar}
            className={`photo-rail ${varied ? 'varied' : ''} ${tilted ? 'tilted' : ''}`}
            gap={gap}
            momentum={momentum}
            dragEnabled={enabled}
            dir={rtl ? 'rtl' : 'ltr'}
            aria-label="Landscape collection"
            aria-describedby="keyboard-hint"
            data-testid="main-rail"
            onDragStart={() => setDragging(true)}
            onDragEnd={() => {
              setDragging(false);
              setEvents((n) => n + 1);
            }}
            onScroll={(event) => {
              const node = event.currentTarget;
              setProgress(
                Math.abs(node.scrollLeft) / Math.max(1, node.scrollWidth - node.clientWidth),
              );
            }}
          >
            {scenes.map(([id, name, label], index) => (
              <figure className={`photo photo-${index}`} key={id}>
                <img
                  src={`${import.meta.env.BASE_URL}${id}.svg`}
                  alt={name}
                  width="400"
                  height="480"
                  draggable={false}
                />
                <figcaption>
                  <span>{label}</span>
                  <strong>{name}</strong>
                </figcaption>
              </figure>
            ))}
          </DraggableRail>
          <div className="under-rail shell">
            <p id="keyboard-hint">
              Drag or swipe. Tab to the rail, then use <kbd>←</kbd> <kbd>→</kbd>{' '}
              <span className="desktop-hint">or Home / End.</span>
            </p>
            <div className="scroll-controls">
              <button
                aria-label="Scroll to start"
                onClick={() => rail.current?.scrollTo({ left: 0, behavior: 'instant' })}
              >
                ↤
              </button>
              <button
                aria-label="Scroll forward"
                onClick={() =>
                  rail.current?.scrollBy({ left: rtl ? -360 : 360, behavior: 'instant' })
                }
              >
                →
              </button>
            </div>
          </div>
          {!hideScrollbar && (
            <div className="progress shell" aria-hidden="true">
              <span style={{ width: `${Math.max(4, progress * 100)}%` }} />
            </div>
          )}
          <div className="options shell" aria-label="Rail settings">
            <label>
              Start at
              <select
                aria-label="Start at"
                value={initialPosition}
                onChange={(event) => {
                  setInitialPosition(event.target.value as 'start' | 'center' | 'end');
                  setProgress(0);
                  setDragging(false);
                }}
              >
                <option value="start">Start</option>
                <option value="center">Middle</option>
                <option value="end">End</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={tilted}
                onChange={(event) => setTilted(event.target.checked)}
              />{' '}
              Tilt photos
            </label>
            <label>
              <input
                type="checkbox"
                checked={!hideScrollbar}
                onChange={(event) => setHideScrollbar(!event.target.checked)}
              />{' '}
              Show scrollbar
            </label>
            <label className="gap-control">
              Spacing{' '}
              <input
                aria-label="Item spacing"
                type="range"
                min="4"
                max="64"
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
              />
              <output>{gap}px</output>
            </label>
            <label>
              <input
                type="checkbox"
                checked={momentum}
                onChange={(e) => setMomentum(e.target.checked)}
              />{' '}
              Momentum
            </label>
            <label>
              <input
                type="checkbox"
                checked={varied}
                onChange={(e) => setVaried(e.target.checked)}
              />{' '}
              Mixed widths
            </label>
            <label>
              <input
                type="checkbox"
                checked={rtl}
                onChange={(e) => {
                  setRtl(e.target.checked);
                }}
              />{' '}
              RTL
            </label>
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />{' '}
              Dragging
            </label>
          </div>
        </section>
        <section className="details shell" aria-label="Features">
          <div>
            <span className="feature-number">01</span>
            <h3>Feels familiar.</h3>
            <p>
              Mouse, trackpad, touch, and keyboard. Built on the scrolling your browser already does
              well.
            </p>
          </div>
          <div>
            <span className="feature-number">02</span>
            <h3>Fits right in.</h3>
            <p>
              Images, cards, or something entirely yours. Bring your components and your own style.
            </p>
          </div>
          <div>
            <span className="feature-number">03</span>
            <h3>Travels light.</h3>
            <p>
              No runtime dependencies beyond React. A small API with room for the details that
              matter.
            </p>
          </div>
        </section>
        <section className="cards-section shell" aria-labelledby="cards-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MORE THAN A PHOTO STRIP</p>
              <h2 id="cards-title">Everything you bring along.</h2>
            </div>
            <span className="muted">Custom children · 12px gap</span>
          </div>
          <DraggableRail
            gap={12}
            hideScrollbar={hideScrollbar}
            aria-label="Travel notes"
            data-testid="cards-rail"
            className="cards-rail"
            momentum={false}
          >
            {scenes.map(([id, name, label]) => (
              <article className="note-card" key={id}>
                <span className="note-category">FIELD NOTES / {label.slice(0, 2)}</span>
                <h3>{name}</h3>
                <p>Leave a little space for the unexpected. Some places are worth taking slowly.</p>
                <div className="note-footer">
                  <a
                    href={`#note-${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSaved((s) => (s.includes(id) ? s : [...s, id]));
                    }}
                  >
                    Keep this note ↗
                  </a>
                  <button
                    aria-label={`Save ${name}`}
                    aria-pressed={saved.includes(id)}
                    onClick={() =>
                      setSaved((s) =>
                        s.includes(id) ? s.filter((item) => item !== id) : [...s, id],
                      )
                    }
                  >
                    {saved.includes(id) ? 'Saved ✓' : 'Save +'}
                  </button>
                </div>
              </article>
            ))}
            <article className="note-card">
              <span className="note-category">YOUR TURN</span>
              <h3>Where to next?</h3>
              <label>
                Your destination
                <input aria-label="Destination" placeholder="Somewhere new…" />
              </label>
            </article>
          </DraggableRail>
          <p className="helper" role="status">
            {saved.length
              ? `${saved.length} notes saved.`
              : 'Links and buttons stay clickable. A drag won’t accidentally open them.'}
          </p>
        </section>
        <section className="usage shell" id="usage">
          <div>
            <p className="eyebrow">A SMALL API. A LONG WAY TO GO.</p>
            <h2>
              Give your content
              <br />
              some breathing room.
            </h2>
            <p>
              One component and a stylesheet.
              <br />
              Use ordinary images, Next.js Image, or any React child.
            </p>
            <span className="release-note">Open source · v0.1.0</span>
          </div>
          <div className="code-window">
            <div className="code-title">
              <span>your-component.tsx</span>
              <span>React + TypeScript</span>
            </div>
            <pre>
              <code>{`import { DraggableRail } from 'react-drift-rail';\nimport 'react-drift-rail/styles.css';\n\n<DraggableRail aria-label="A few favorites" gap={28}\n  initialPosition="center" hideScrollbar>\n  {photos.map(photo => (\n    <img key={photo.id} src={photo.src}\n      alt={photo.alt} width={320} height={380} />\n  ))}\n</DraggableRail>`}</code>
            </pre>
          </div>
        </section>
        <output data-testid="drag-events" className="sr-only">
          {events}
        </output>
      </main>
      <footer className="shell">
        <span className="brand">↔ drift rail</span>
        <span>Made for the way you move.</span>
        <span>MIT licensed · React 18 / 19</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
