import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts', // los *.spec.ts son de Vitest (ng test)
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4310',
    channel: 'chrome', // usa el Chrome instalado
    // Las pestañas en segundo plano se congelan y no pintan los avisos de BroadcastChannel.
    launchOptions: { args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] },
  },
  webServer: { command: 'npx ng serve --port 4310', url: 'http://localhost:4310', timeout: 180_000, reuseExistingServer: true },
});
