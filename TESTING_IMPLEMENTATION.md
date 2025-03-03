# VowSwap Testing Implementation

This document outlines the testing implementation for the VowSwap platform, focusing on authentication and user management functionality.

## Testing Strategy

We've implemented a comprehensive testing strategy that includes:

1. **Unit Tests** - Testing individual components in isolation
2. **API Tests** - Testing API endpoints and their responses
3. **End-to-End Tests** - Testing complete user flows

## Test Coverage

### Authentication Components

- **SignUpForm** - Tests for form validation, submission, and error handling
- **PasswordResetForm** - Tests for both request reset and reset password forms
- **EmailVerification** - Tests for verification success, failure, and loading states

### Authentication API Endpoints

- **Register API** - Tests for user creation, validation, and error handling
- **Verify Email API** - Tests for email verification with valid and invalid tokens
- **Forgot Password API** - Tests for password reset request handling
- **Reset Password API** - Tests for password reset with valid and invalid tokens

### End-to-End Flows

- **Complete Authentication Flow** - Tests for registration, verification, and login
- **Password Reset Flow** - Tests for requesting and completing password reset
- **User Profile Management** - Tests for updating profile information and managing addresses

## Running the Tests

### Unit Tests with Jest

To run all unit tests:

```bash
npm test
```

To run tests with watch mode (for development):

```bash
npm run test:watch
```

To run tests with coverage report:

```bash
npm run test:coverage
```

To run specific test files:

```bash
npm test -- __tests__/components/SignUpForm.test.jsx
npm test -- __tests__/api/auth.test.js
```

### End-to-End Tests with Cypress

To open Cypress Test Runner:

```bash
npm run cypress
```

To run Cypress tests headlessly:

```bash
npm run cypress:headless
```

To run all E2E tests with the development server:

```bash
npm run e2e
```

To run specific E2E test files:

```bash
npx cypress run --spec "cypress/e2e/auth-flow.cy.js"
npx cypress run --spec "cypress/e2e/profile-management.cy.js"
```

## Test Environment Setup

### Test User Credentials

For tests that require an existing user, you can set up environment variables:

```bash
# In .env.test or via CI/CD environment variables
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Password123!
```

Alternatively, you can use the default test credentials defined in the Cypress commands.

### Email Testing

For tests involving email verification or password reset:

1. In a production-like environment, consider using a service like [Mailhog](https://github.com/mailhog/MailHog) to capture and inspect emails
2. For local development, you can modify the tests to bypass email verification or use environment variables to control the behavior

## Continuous Integration

The tests are configured to run in a CI/CD pipeline. The configuration is in `.github/workflows/test.yml` (if implemented).

## Test Data Management

- Unit tests use mock data and don't interact with the database
- API tests use mocked Prisma client to avoid database interactions
- E2E tests may create real data in the test database
  - Use unique identifiers (e.g., timestamps in email addresses) to avoid conflicts
  - Consider implementing a cleanup mechanism to remove test data after tests run

## Troubleshooting Common Issues

### Jest Tests

- **Module not found errors**: Ensure the module paths in your tests match the actual file structure
- **Mock issues**: Check that all external dependencies are properly mocked
- **Timeout errors**: Increase the timeout for tests that involve async operations

### Cypress Tests

- **Element not found errors**: Use `cy.contains()` or `cy.get()` with appropriate selectors
- **Timing issues**: Use `cy.wait()` or `cy.should()` with appropriate assertions
- **Authentication issues**: Ensure the test user exists and has the correct permissions

## Next Steps

1. **Increase Test Coverage**: Add tests for additional components and flows
2. **Performance Testing**: Implement performance tests using Lighthouse CI
3. **Accessibility Testing**: Add accessibility tests using Cypress-axe
4. **Visual Regression Testing**: Consider adding visual regression tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/guides/overview/why-cypress)
