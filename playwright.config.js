import { defineConfig } from '@playwright/test';

const live = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: live ?? 'http://localhost:8766' },
  webServer: live ? undefined : { command: 'python3 -m http.server 8766', url: 'http://localhost:8766/index.html', reuseExistingServer: true },
});
