# Architecture

One package, one public component, and one required stylesheet. `src/core/math.ts` contains pure coordinate and decay functions. `src/core/controller.ts` is a small DOM adapter with no React dependency. `src/DraggableRail.tsx` owns the React lifecycle, callback freshness, ref, attributes, and keyboard handling. This separation permits later extraction without creating a speculative core package today.

Native `scrollLeft` is the only position state. Pointer samples and animation IDs live in controller closures. React never renders frame-by-frame movement. Layout extents are measured at gesture start; momentum rechecks boundaries each frame to handle layout changes. During an active drag, a changing layout is ultimately bounded by the browser; the next gesture reads fresh dimensions.

The trade-off for native touch is intentional: touch gets browser panning, directional arbitration, zoom, and momentum; it does not emit custom drag callbacks. Mouse and pen add dragging with a six-pixel intent threshold and delayed pointer capture. The document listens only while a candidate gesture exists, so releasing outside the rail cleans up even before capture. Cancel, lost capture, blur, visibility changes, and disposal share cleanup. Touch gestures, form controls, native draggable areas, and nested rails are excluded.

Mouse/pen inertia is optional, disabled by default, capped at 3 px/ms, and exponentially decays with a 180 ms time constant. The integral is independent of frame rate. Pauses longer than 100 ms before release do not coast, background frames are capped, and reduced motion disables inertia. No extra animation dependency is warranted. Native programmatic animations should not overlap optional momentum.

LTR uses [0, extent]; modern RTL uses [-extent, 0]. Arrows are physical directions; Home/End are reading-order boundaries. This matches modern CSSOM behavior, including fractional offsets. Legacy RTL browser modes are excluded from the support policy.

The build uses tsup with React and JSX runtime externalized. Both ESM and CJS preserve a client boundary for React Server Components and emit correctly paired `.d.ts`/`.d.cts` declarations. tsup's declaration bundler currently uses an internal TypeScript option deprecated in TypeScript 6, so only its declaration pass suppresses that deprecation. The application type checks remain strict. CSS is a separate explicit export marked as side-effectful; JavaScript is tree-shakeable.

Next.js is a development dependency solely for validating the example. No module evaluates DOM globals during import. Effects install behavior after mounting, so SSR produces real children and a scrollable container before enhancement.

Version 1 excludes a bespoke imperative handle, configurable physics knobs, snapping, and slide state. Consumers have the native element ref and ordinary CSS. The public callbacks describe gestures without exposing controller details.
