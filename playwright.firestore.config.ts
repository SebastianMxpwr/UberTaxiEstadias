import { defineConfig } from '@playwright/test';
import base from './playwright.config';

process.env['E2E_FIRESTORE'] = '1'; // e2e/viaje.e2e.ts vacía el emulador antes de cada prueba

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: 'http://localhost:4311' },
  webServer: [
    { command: 'npx firebase emulators:start --only firestore --project demo-traslados', url: 'http://127.0.0.1:8080', timeout: 180_000, reuseExistingServer: true },
    { command: 'npx ng serve --configuration firestore --port 4311', url: 'http://localhost:4311', timeout: 180_000, reuseExistingServer: true },
  ],
});
