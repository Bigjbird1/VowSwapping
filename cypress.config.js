const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Resource optimization fix applied
  // Optimize browser launch options to reduce memory usage and address spawn errors
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 1,
  retries: {
    runMode: 2,
    openMode: 0
  },
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  blockHosts: ['*google-analytics.com', '*googletagmanager.com'],
  
  // Set Chrome as the default browser to prevent Electron from being used
  defaultBrowser: 'chrome',
  
  // Optimize browser launch options
  browsers: [
    {
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
      version: 'stable',
      path: '',
      majorVersion: 'stable',
      isHeaded: false,
      isHeadless: true,
    }
  ],
  
  // Add browser launch options
  launchOptions: {
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--no-sandbox',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-infobars',
      '--disable-breakpad',
      '--disable-canvas-aa',
      '--disable-2d-canvas-clip-aa',
      '--disable-gl-drawing-for-tests',
      '--mute-audio',
      '--disable-ipc-flooding-protection',
      '--js-flags=--expose-gc',
      '--disable-site-isolation-trials',
      '--window-size=1280,720'
    ]
  },
  e2e: {
    baseUrl: 'http://localhost:3002',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  env: {
    testUser: {
      email: 'test@example.com',
      password: 'Password123!',
    },
    sellerUser: {
      email: 'seller@example.com',
      password: 'Password123!',
    },
  },
});
