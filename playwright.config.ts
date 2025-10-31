import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 * 
 * True end-to-end tests that interact with a real browser.
 * Tests verify actual user interactions, rendering, and DOM.
 * 
 * Run tests:
 * - pnpm test:e2e           # Run all E2E tests
 * - pnpm test:e2e:ui       # Interactive UI mode
 * - pnpm test:e2e:headed   # Run with visible browser
 * - pnpm test:e2e:debug    # Debug mode
 */

export default defineConfig({
  testDir: './tests/e2e-browser',
  
  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],

  /* Retry on CI and for connection issues */
  retries: process.env['CI'] ? 3 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : undefined,

  /* Increase timeout for slower tests and connection setup */
  timeout: 90 * 1000, // 90 seconds per test (increased for Firefox)
  
  /* Increase global timeout for setup/teardown */
  globalTimeout: 30 * 60 * 1000, // 30 minutes total

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['list'],
  ],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4321',
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      retries: 3, // Retry Firefox tests more aggressively
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: false, // Always start fresh to avoid conflicts
    timeout: process.env['CI'] ? 300 * 1000 : 120 * 1000, // 5 min in CI, 2 min locally
    stdout: 'pipe',
    stderr: 'pipe',
    // Increase readiness check retries for Firefox
    env: { 
      NODE_ENV: 'development' 
    },
  },
});
