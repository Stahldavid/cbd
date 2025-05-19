// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests',
  testMatch: '**/*.spec.js', // Only run files with .spec.js extension
  timeout: 60000, // 60 seconds - increased timeout for API responses
  expect: {
    timeout: 10000 // 10 seconds
  },
  // Run tests in files in parallel
  fullyParallel: false, // Set to false to avoid race conditions when testing a stateful app
  // Reporter to use
  reporter: 'html',
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',
    
    // Record trace for each test (slow but useful for debugging)
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video for failing tests
    video: 'on-first-retry',
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        // Browser size that works well for the app
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  
  // Local development web server config
  webServer: {
    command: 'echo "Using existing server"',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
};

module.exports = config; 