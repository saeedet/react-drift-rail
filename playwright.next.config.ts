import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e-next',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3002' },
  webServer: {
    command: 'next start examples/next -p 3002',
    url: 'http://127.0.0.1:3002',
    reuseExistingServer: false,
  },
});
