# VowSwapping Testing Implementation Guide

This guide explains how to run the tests for the VowSwapping application to ensure that all features are working correctly.

## Prerequisites

Before running the tests, make sure you have the following installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- A local development environment with all dependencies installed

## Test Types

The VowSwapping application has several types of tests:

1. **Database Tests**: Verify that the database schema is correctly set up and that the models work as expected.
2. **API Tests**: Verify that the backend endpoints work correctly and return the expected responses.
3. **End-to-End Tests**: Verify that the application works correctly from the user's perspective, testing complete user flows.

## Running Tests

### Quick Start

To run all tests and generate a summary report, use the following command:

```bash
./run-tests.sh
```

This script will:
1. Test the database connection
2. Run database model tests
3. Run API tests
4. Run end-to-end tests with Cypress
5. Generate a summary report

### Running Specific Tests

#### Database Connection Test

To test the database connection and verify that the schema is correctly set up:

```bash
node test-db-connection.js
```

#### Database Model Tests

To run only the database model tests:

```bash
./run-db-tests.sh
```

#### API Tests

To run only the API tests:

```bash
./run-api-tests.sh
```

#### End-to-End Tests

To run a specific Cypress end-to-end test:

```bash
./run-single-cypress-test.sh [test-file]
```

For example:

```bash
./run-single-cypress-test.sh cypress/e2e/auth.cy.js
```

## Test Results

After running the tests, you can view the results in the following locations:

- **Summary Report**: `test-results-summary.md`
- **Detailed Logs**: 
  - `test-output-detailed.log` (all test output)
  - `test-output-part1.log` (database tests)
  - `test-output-part2.log` (API tests)
  - `test-output-part3.log` (end-to-end tests)
- **Cypress Screenshots**: `cypress/screenshots/`
- **Cypress Videos**: `cypress/videos/`

## Troubleshooting

### Database Tests

If the database tests are failing, check the following:

1. Make sure the database URL is correctly set in the `.env` file.
2. Verify that the database schema is up to date by running `npx prisma db push`.
3. Check the database connection by running `node test-db-connection.js`.

### API Tests

If the API tests are failing, check the following:

1. Make sure the API server is running.
2. Verify that the API endpoints are correctly implemented.
3. Check the API test logs for specific errors.

### End-to-End Tests

If the end-to-end tests are failing, check the following:

1. Make sure the application is running locally.
2. Verify that the test data is correctly set up.
3. Check the Cypress screenshots and videos for visual feedback on what went wrong.
4. Run the tests in interactive mode with `npx cypress open` to debug specific issues.

## Adding New Tests

### Database Tests

Add new database tests in the `__tests__/database/` directory. Follow the existing test patterns and use the test helpers provided in `__tests__/database/db-test-setup.js`.

### API Tests

Add new API tests in the `__tests__/api/` directory. Use the Jest testing framework and the Supertest library for making HTTP requests.

### End-to-End Tests

Add new end-to-end tests in the `cypress/e2e/` directory. Use the Cypress testing framework and the custom commands provided in `cypress/support/commands.js` and `cypress/support/testDataCommands.js`.

## Continuous Integration

The tests are automatically run in the CI/CD pipeline when changes are pushed to the repository. The pipeline will fail if any tests fail, preventing broken code from being deployed.

## Best Practices

1. **Write Tests First**: Follow a test-driven development (TDD) approach by writing tests before implementing features.
2. **Keep Tests Independent**: Each test should be independent of others and should not rely on the state created by previous tests.
3. **Use Descriptive Names**: Give your tests descriptive names that explain what they are testing.
4. **Test Edge Cases**: Don't just test the happy path; also test edge cases and error conditions.
5. **Keep Tests Fast**: Tests should run quickly to provide fast feedback during development.
6. **Maintain Test Data**: Keep test data up to date and representative of real-world scenarios.
7. **Review Test Coverage**: Regularly review test coverage to identify areas that need more testing.
