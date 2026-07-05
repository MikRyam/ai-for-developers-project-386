import { defineConfig } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run start:test',
      cwd: '../backend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
    {
      command: 'npm run dev:vite',
      cwd: '../frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
      env: {
        VITE_BACKEND_URL: 'http://localhost:3000',
      },
    },
  ],
  projects: [
    {
      name: 'api',
      use: {
        baseURL: BACKEND_URL,
      },
      testMatch: /tests\/api\/.*\.spec\.ts/,
    },
    {
      name: 'ui',
      use: {
        browserName: 'chromium',
      },
      testMatch: /tests\/ui\/.*\.spec\.ts/,
    },
  ],
});
