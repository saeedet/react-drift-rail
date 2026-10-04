# Contributing

Use current Node 24 LTS (24.15+) or Node 26 and npm; the test toolchain requires it. Run `npm ci`, then `npm run dev`. The React demo exercises local source; build before running the Next.js example.

For a behavior change, add a regression test for the user interaction. Use unit tests for lifecycle and pure math; use Playwright when real focus, capture, layout, scrolling, or click synthesis matters. Keep new runtime dependencies exceptional and justify them in the PR.

Before submitting: `npm run check`, `npm run test:e2e`, `npm run build:demo`, `npm run build:next`, `npm run test:next`, and `npm run test:package`. Install browsers with `npx playwright install --with-deps` on Linux. Update the README and changelog if the public contract changes.

Explain the concrete problem, the resulting behavior, and the tests performed. Small focused pull requests are easiest to review. Bug reports should include a runnable reproduction, browser/OS, React version, and input method.

Do not include credentials, personal reference images, generated build output, or `node_modules`. Release procedures belong to maintainers and are documented in `docs/PUBLISHING.md`.
