// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Add accessibility commands
beforeEach(() => {
  cy.injectAxe();
});

// Preserve cookies between tests
Cypress.Cookies.defaults({
  preserve: ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url'],
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // This is useful for 3rd party library errors that don't affect the test
  console.log('Uncaught exception:', err.message);
  return false;
});

// Log console errors from application
Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'error').as('consoleError');
});

// Add custom assertion for checking console errors
Cypress.Commands.add('noConsoleErrors', () => {
  cy.get('@consoleError').then((spy) => {
    const errors = spy.args.map(args => args[0]);
    if (errors.length > 0) {
      cy.log('Console errors found:', errors);
    }
    expect(spy).to.not.be.called;
  });
});

// Add command to check for accessibility violations
Cypress.Commands.add('checkAccessibility', (context, options) => {
  cy.checkA11y(context, options, null, {
    includedImpacts: ['critical', 'serious'],
  });
});

// Add command to check page performance
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    const navigationStart = performance.timing.navigationStart;
    const loadEventEnd = performance.timing.loadEventEnd;
    const loadTime = loadEventEnd - navigationStart;
    
    cy.log(`Page load time: ${loadTime}ms`);
    
    // Fail test if load time is too high (adjust threshold as needed)
    expect(loadTime).to.be.lessThan(10000); // 10 seconds
  });
});
