import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for A11y Robot accessibility testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Accessibility-friendly defaults */
    reducedMotion: 'reduce',
    colorScheme: 'light',
    
    /* Longer timeout for accessibility testing */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers for cross-browser accessibility testing */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional accessibility settings for Chromium
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--disable-web-security',
            '--disable-features=TranslateUI'
          ]
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific accessibility settings
        launchOptions: {
          firefoxUserPrefs: {
            'ui.prefersReducedMotion': 1,
            'browser.display.use_system_colors': true
          }
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit-specific accessibility settings
        launchOptions: {
          args: [
            '--disable-web-security'
          ]
        }
      },
    },

    /* Test against mobile viewports for mobile accessibility */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile Chrome accessibility settings
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--disable-web-security'
          ]
        }
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Mobile Safari accessibility settings
        launchOptions: {
          args: [
            '--disable-web-security'
          ]
        }
      },
    },

    /* High contrast mode testing */
    {
      name: 'High Contrast',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        forcedColors: 'active',
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--force-color-profile=srgb',
            '--disable-web-security'
          ]
        }
      },
    },

    /* Reduced motion testing */
    {
      name: 'Reduced Motion',
      use: {
        ...devices['Desktop Chrome'],
        reducedMotion: 'reduce',
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--disable-web-security'
          ]
        }
      },
    },
  ],

  /* Global setup for accessibility testing */
  globalSetup: require.resolve('./src/__tests__/setup/global-setup.ts'),
  
  /* Global teardown */
  globalTeardown: require.resolve('./src/__tests__/setup/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run serve',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
}); 