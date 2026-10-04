# Validation record

Validated on 2026-10-04 on macOS 14.6.1 arm64 with Node 26.0.0 and npm 11.12.1. CI is configured for Node 24 on Ubuntu. Hosted results are available in the [CI workflow](https://github.com/saeedet/react-drift-rail/actions/workflows/ci.yml); the results below describe local validation.

## Passed locally

| Check                           | Result                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Library build                   | ESM, CJS, declarations, CSS, source maps generated                                                      |
| Strict TypeScript               | Source plus consumer test using package exports passed                                                  |
| ESLint / Prettier               | Passed                                                                                                  |
| Unit / SSR tests                | 44 passed                                                                                               |
| Current Playwright 1.63.0       | 37 browser cases passed; 2 intentionally skipped                                                        |
| Supplementary Playwright 1.61.1 | 24 WebKit cases passed; 2 intentionally skipped                                                         |
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

## WebKit limitation and supplemental coverage

Playwright 1.63.0 uses Chromium 153.0.8010.12 and Firefox 155.0 here. Both desktop profiles and the Pixel 7 Chromium profile passed. macOS 14 receives frozen WebKit revision 2251, reporting version 26.5. The current runner fails during page creation with:

```text
browserContext.newPage: Protocol error (Page.overrideSetting): Unknown setting: PushAPIEnabled
```

This happens before application code executes. The unfiltered `npm run test:e2e` therefore does **not** pass on this specific host with the committed current runner. The project keeps the full WebKit matrix enabled for supported hosts/CI, rather than hiding these failures.

An isolated Playwright 1.61.1 installation outside the repository successfully ran the same test source against the same local demo and the frozen WebKit. Desktop Safari and iPhone 13 profiles each passed twelve applicable tests. The mobile WebKit profile uses native `scrollBy` in place of unsupported wheel injection. The two CDP-only touch cases were skipped. No package code or dependency files were patched to obtain these results.

To reproduce the current-runner checks on this Mac:

```sh
npm run test:e2e -- --project=chromium --project=firefox --project=mobile-chromium
```

For supplementary WebKit validation, run `npm run dev -- --host 127.0.0.1 --port 5173`. In a separate temporary directory, install `@playwright/test@1.61.1` and `@axe-core/playwright`, copy `tests/e2e/rail.spec.ts` there, and run it with this configuration:

```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'rail.spec.ts',
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5173' },
  projects: [
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
});
```

The isolated runner reuses the downloaded frozen browser. Keep this diagnostic setup outside the package. Run the committed full suite on a supported, current OS before release. Playwright's [browser documentation](https://playwright.dev/docs/browsers) explains that its WebKit is a patched engine, not the shipping Safari app.

## Package size

At this revision, `npm run size` reports:

| Artifact            | Bytes | Gzip bytes |
| ------------------- | ----: | ---------: |
| ESM JavaScript      | 6,132 |      2,480 |
| CommonJS JavaScript | 6,667 |      2,714 |
| CSS                 |   730 |        352 |

Run `npm run size` for the current tarball size (roughly 21 KB compressed), including declarations, both formats, source maps, README, changelog, license, and package metadata. Documentation/metadata changes can change tarball size without changing runtime size. Enforced budgets are 6 KiB gzip per JS entry and 1 KiB gzip for CSS. React is a peer dependency and excluded from these sizes.

## Hosted validation and maintainer check

The [CI and playground deployment for 419b3b0](https://github.com/saeedet/react-drift-rail/actions/runs/37217590281) passed on Ubuntu, including the full current-runner Chromium, Firefox, desktop WebKit, and mobile browser profiles, production builds, Next.js browser coverage, and packed consumer installs. Later release commits must pass the same checks.

The maintainer's real-device check passed as reported above. Manual assistive-technology coverage and additional device-specific checks remain useful follow-up work; they are not claimed by the automated suite.

## Remaining manual coverage

- Check shipping Safari and real iOS/Android browsers, including horizontal-to-vertical gestures, pinch zoom, rotation, and nested scroll regions.
- Check a hardware pen and browser takeover/cancellation behavior.
- Manually test VoiceOver and NVDA: region naming, focus visibility, child controls, and navigation order.

Known v1 boundaries: native touch does not emit custom drag callbacks; configuration cleanup does not emit drag callbacks; programmatic smooth scrolling should not overlap custom momentum; legacy positive RTL scroll models are unsupported. No virtualization, snapping, looping, or autoplay is included.
