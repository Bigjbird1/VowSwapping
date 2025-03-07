# Cypress Testing Guide for VowSwapping

This guide explains how to write and run Cypress tests for the VowSwapping application.

## Introduction to Cypress

Cypress is an end-to-end testing framework that makes it easy to write and debug tests for web applications. It runs in the same run-loop as your application, giving you native access to every object.

## Setup

The VowSwapping project already has Cypress configured. The configuration is in `cypress.config.js` and includes:

- Base URL: `http://localhost:3000`
- Video recording: Enabled
- Screenshot on failure: Enabled
- Resource optimization: Applied via `cypress-resource-fix.js`

## Test Structure

Cypress tests are organized in the `cypress/e2e/` directory and are grouped by feature:

- `auth.cy.js`: Authentication tests (sign up, sign in, password reset)
- `auth-flow.cy.js`: Complete authentication flows
- `profile-management.cy.js`: User profile management tests
- `shopping-experience.cy.js`: Product browsing and searching tests
- `checkout.cy.js`: Cart and checkout process tests
- `seller.cy.js`: Seller functionality tests
- `wishlist-reviews.cy.js`: Wishlist and review functionality tests

## Test Data

Test data is managed through fixtures in the `cypress/fixtures/` directory:

- `users.json`: Test user accounts
- `products.json`: Test products
- `addresses.json`: Test addresses
- `orders.json`: Test orders
- `wishlist.json`: Test wishlist items
- `reviews.json`: Test reviews

The test data is set up automatically by the `cypress/seedTestData.js` script, which is run before the tests.

## Custom Commands

Custom commands are defined in `cypress/support/commands.js` and `cypress/support/testDataCommands.js`. These commands provide shortcuts for common operations:

- `cy.login(email, password)`: Log in with the specified credentials
- `cy.mockAuthState(userType)`: Mock the authentication state
- `cy.mockProductsApi()`: Mock the products API
- `cy.mockWishlistApi()`: Mock the wishlist API
- `cy.mockReviewsApi()`: Mock the reviews API
- `cy.mockOrdersApi()`: Mock the orders API
- `cy.mockAddressesApi()`: Mock the addresses API

## Writing Tests

### Test Structure

Cypress tests are written using Mocha's BDD syntax:

```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Setup code that runs before each test
    cy.visit('/');
  });

  it('should do something', () => {
    // Test code
    cy.get('button').click();
    cy.url().should('include', '/expected-path');
  });
});
```

### Best Practices

1. **Use descriptive test names**: Make it clear what the test is checking.
2. **Keep tests independent**: Each test should be able to run on its own.
3. **Use data attributes for selectors**: Add `data-testid` attributes to elements you want to select in tests.
4. **Mock external dependencies**: Use the custom commands to mock APIs and authentication.
5. **Check for visibility**: Use `cy.get(...).should('be.visible')` to ensure elements are visible before interacting with them.
6. **Use assertions**: Make sure to include assertions to verify the expected behavior.
7. **Handle asynchronous operations**: Use `cy.wait('@aliasName')` to wait for API calls to complete.

### Example Test

```javascript
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/auth/signin');
  });

  it('should sign in with valid credentials', () => {
    // Enter credentials
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    
    // Submit the form
    cy.get('[data-testid="signin-button"]').click();
    
    // Wait for the API call to complete
    cy.wait('@signInRequest');
    
    // Verify that the user is redirected to the home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Verify that the user is signed in
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});
```

## Running Tests

### Running All Tests

To run all Cypress tests:

```bash
./run-tests.sh
```

This will run all the tests and generate a summary report.

### Running a Specific Test

To run a specific Cypress test:

```bash
./run-single-cypress-test.sh cypress/e2e/auth.cy.js
```

### Interactive Mode

To run Cypress in interactive mode:

```bash
npx cypress open
```

This will open the Cypress Test Runner, which allows you to select and run tests interactively.

## Debugging Tests

### Screenshots and Videos

Cypress automatically takes screenshots when tests fail and records videos of test runs. These can be found in:

- Screenshots: `cypress/screenshots/`
- Videos: `cypress/videos/`

### Console Logs

You can use `cy.log()` to add messages to the Cypress command log:

```javascript
cy.log('This is a log message');
```

You can also use `console.log()` to log messages to the browser console:

```javascript
console.log('This is a console message');
```

### Pausing Tests

You can pause tests to inspect the state of the application:

```javascript
cy.pause();
```

Or you can use the debugger statement:

```javascript
debugger;
```

## Continuous Integration

The Cypress tests are run automatically in the CI/CD pipeline when changes are pushed to the repository. The pipeline will fail if any tests fail, preventing broken code from being deployed.

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API Reference](https://docs.cypress.io/api/table-of-contents)
