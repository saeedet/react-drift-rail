import Image from 'next/image';
import { DraggableRail } from 'react-drift-rail';
// This page remains a Server Component. The package provides its client boundary.
export default function Page() {
  return (
    <main>
      <p>DRIFT RAIL / NEXT.JS APP ROUTER</p>
      <h1>Your images. Native flow.</h1>
      <p>Drag, swipe, or focus this rail and press the arrow keys.</p>
      <DraggableRail
        initialPosition="center"
        hideScrollbar
        aria-label="Landscapes rendered with Next Image"
        gap={24}
      >
        {['alpine', 'coast', 'dunes', 'forest', 'town', 'lake'].map((name) => (
          <Image
            key={name}
            src={`/${name}.svg`}
            alt={`${name} landscape illustration`}
            width={320}
            height={380}
            unoptimized
          />
        ))}
      </DraggableRail>
      <p>
        Local SVG illustrations are unoptimized. Replace them with your own images to use Next.js
        image optimization.
      </p>
    </main>
  );
}
