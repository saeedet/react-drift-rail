# Validation record

Version 0.1.1 validated on 2026-10-11 on macOS 27.0.1 arm64 with Node 26.11.0 and npm 11.20.0. CI is configured for Node 24 on Ubuntu. Hosted results are available in the [CI workflow](https://github.com/saeedet/react-drift-rail/actions/workflows/ci.yml); the results below describe local validation.

## Passed locally

| Check                           | Result                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Library build                   | ESM, CJS, declarations, CSS, source maps generated                                                      |
| Strict TypeScript               | Source plus consumer test using package exports passed                                                  |
| ESLint / Prettier               | Passed                                                                                                  |
| Unit / SSR tests                | 51 passed                                                                                               |
| Current Playwright 1.63.0       | Full five-profile matrix: 96 passed; 4 intentionally skipped                                            |
| React demo production build     | Passed with Vite 8.3.2                                                                                  |
| Next.js production build        | Passed with Next.js 16.3.8; App Router page prerendered                                                 |
| Next.js production browser test | 1 passed: built package imports, six Next Image children, hydration, keyboard, dragging, no page errors |
| Tarball consumer installs       | React 18 and 19: ESM, CJS, CSS resolution, SSR passed                                                   |
| Package inspection              | 12 files; only approved distribution files and metadata                                                 |
| Runtime bundling                | React/JSX runtime external; no third-party modules in bundle source maps                                |
| Dependency audit                | Zero vulnerabilities reported, including development dependencies                                       |
| Visual inspection               | Desktop 1440px and mobile 390px checked; no clipping or document-wide horizontal overflow observed      |

Tests cover rendering, refs, movement threshold, clicks, pointer cancellation, lost capture, blur, button release, disabled dragging, pointer filtering, pen dispatch, native touch delegation, editable controls, nested rails, consumer overrides, callback freshness, Strict Mode, keyboard boundaries, RTL, cleanup, optional inertia, reduced motion, and stationary release. Added coverage verifies initial start/center/end positions, both RTL directions, late image widths, async children, observer cleanup, preserved reading positions after interaction, hidden-scrollbar toggles, and optional demo tilt.

The browser matrix checks real scrolling, dragging, click suppression, focus/child keyboard behavior, RTL, reduced motion, and automated WCAG 2 A/AA and 2.1 AA rules with axe. Chromium mobile additionally receives actual injected touch sequences: horizontal rail movement and vertical page movement both passed. Other projects skip that CDP-specific test. On 2026-10-04, the maintainer reported testing on a real device and confirmed that it worked as expected. Device, OS, browser, and individual gesture details were not recorded. No screen-reader, pinch gesture, or hardware stylus validation is claimed.

## Browser layout regressions

All five committed profiles passed with the current Playwright 1.63.0 runner: desktop Chromium, Firefox, WebKit 26.6, Pixel 7 Chromium, and iPhone 13 WebKit. Four CDP-only touch cases are intentionally skipped outside mobile Chromium. The new tests measure both sides of the item group rather than inferring alignment from `scrollLeft`.

Coverage includes fitting and overflowing center layouts, start/end alignment, consumer overrides, variable card widths, 28px gaps, LTR/RTL, overflow-to-fit-to-overflow resizing, and preserved ownership after dragging, wheel input, keyboard navigation, or imperative scrolling. The playground test changes the photo count from six to two, resizes into overflow, reduces it to one, and restores six before dragging. Server rendering includes the fitting-content alignment without needing browser globals.

Desktop visual inspection with two photos measured 404px of free space on both sides at 1440px. The 390px mobile page had no document-wide horizontal overflow. The existing late-image, async-child, inertia, reduced-motion, hidden-scrollbar, focus, and native-touch cases remain in the full suite.

During the earlier 0.1.0 validation, macOS 14's frozen WebKit required a supplemental runner. That host limitation does not apply to this 0.1.1 run on macOS 27. Playwright uses a patched WebKit engine; passing it is not a claim of testing shipping Safari or a physical device for this patch.

## Package size

At this revision, `npm run size` reports:

| Artifact            | Bytes | Gzip bytes |
| ------------------- | ----: | ---------: |
| ESM JavaScript      | 6,327 |      2,521 |
| CommonJS JavaScript | 6,862 |      2,755 |
| CSS                 |   730 |        352 |

Run `npm run size` for the current tarball size (roughly 22 KB compressed), including declarations, both formats, source maps, README, changelog, license, and package metadata. Documentation/metadata changes can change tarball size without changing runtime size. Enforced budgets are 6 KiB gzip per JS entry and 1 KiB gzip for CSS. React is a peer dependency and excluded from these sizes.

## Hosted validation and maintainer check

The [CI and playground deployment for 419b3b0](https://github.com/saeedet/react-drift-rail/actions/runs/37217590281) passed on Ubuntu, including the full current-runner Chromium, Firefox, desktop WebKit, and mobile browser profiles, production builds, Next.js browser coverage, and packed consumer installs. The current 0.1.1 release state must also pass the same checks; see the linked CI workflow for its hosted result.

The maintainer's real-device check passed as reported above. Manual assistive-technology coverage and additional device-specific checks remain useful follow-up work; they are not claimed by the automated suite.

## Remaining manual coverage

- Check shipping Safari and real iOS/Android browsers, including horizontal-to-vertical gestures, pinch zoom, rotation, and nested scroll regions.
- Check a hardware pen and browser takeover/cancellation behavior.
- Manually test VoiceOver and NVDA: region naming, focus visibility, child controls, and navigation order.

Known v1 boundaries: native touch does not emit custom drag callbacks; configuration cleanup does not emit drag callbacks; programmatic smooth scrolling should not overlap custom momentum; legacy positive RTL scroll models are unsupported. No virtualization, snapping, looping, or autoplay is included.
