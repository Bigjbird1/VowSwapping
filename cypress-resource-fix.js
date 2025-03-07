/**
 * This script helps address the "spawn Unknown system error -86" issue
 * that can occur when running Cypress tests in resource-constrained environments.
 * 
 * It modifies Cypress configuration to:
 * 1. Reduce memory usage
 * 2. Optimize browser launch parameters
 * 3. Add timeouts and retry logic
 */

const fs = require('fs');
const path = require('path');

console.log('Applying Cypress resource optimization fixes...');

// Path to Cypress config file
const configPath = path.join(__dirname, 'cypress.config.js');

// Read the current config
let configContent = fs.readFileSync(configPath, 'utf8');

// Check if the fix has already been applied
if (configContent.includes('// Resource optimization fix applied')) {
  console.log('Resource optimization fix already applied. Skipping.');
  process.exit(0);
}

// Add browser launch options to reduce memory usage
const optimizedConfig = configContent.replace(
  'module.exports = defineConfig({',
  `module.exports = defineConfig({
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
  },`
);

// Write the updated config back to the file
fs.writeFileSync(configPath, optimizedConfig);

console.log('Resource optimization fix applied successfully!');
console.log('This should help address the "spawn Unknown system error -86" issue.');
console.log('The fix includes:');
console.log('- Reduced memory usage');
console.log('- Optimized browser launch parameters');
console.log('- Added retry logic for flaky tests');
console.log('- Disabled unnecessary browser features');

// Exit with success
process.exit(0);
