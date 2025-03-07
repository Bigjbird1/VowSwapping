# Cypress Server Setup Guide

## Overview

This document explains how the Cypress E2E tests are configured to work with the development server. We've implemented a solution to address the "Cypress could not verify that your server is running" error by ensuring the server is properly started and verified before running tests.

## Key Changes

1. **Updated Test Scripts**
   - Modified `package.json` to use `start-server-and-test` for all Cypress test scripts
   - Created a dedicated `run-cypress-suite` script that's called after server verification

2. **Improved Test Reliability**
   - The `start-server-and-test` package:
     - Starts the Next.js dev server on port 3002
     - Waits for the server to be ready (verifies http://localhost:3002 is accessible)
     - Runs the tests only after confirming server availability
     - Automatically shuts down the server after tests complete

3. **Simplified Test Scripts**
   - Updated `run-all-tests.sh` to focus on running tests without server management
   - Updated `run-single-cypress-test.sh` to use `start-server-and-test` instead of manual server management

## How to Run Tests

### Running All Tests

```bash
npm run test:all
```

This command:
1. Starts the Next.js dev server on port 3002
2. Waits for the server to be ready
3. Runs the database tests, API tests, and all Cypress E2E tests
4. Shuts down the server when complete

### Running Individual Test Groups

```bash
npm run test:checkout
npm run test:shopping
npm run test:seller
npm run test:wishlist-reviews
```

Each of these commands:
1. Starts the Next.js dev server on port 3002
2. Waits for the server to be ready
3. Runs the specific Cypress test group
4. Shuts down the server when complete

### Running a Single Test File

```bash
./run-single-cypress-test.sh cypress/e2e/auth.cy.js
```

This script:
1. Applies Cypress resource optimization
2. Sets up test data
3. Starts the Next.js dev server on port 3002
4. Waits for the server to be ready
5. Runs the specified test file
6. Shuts down the server when complete

## Troubleshooting

If you encounter issues with the tests:

1. **Server Not Starting**
   - Check if port 3002 is already in use by another process
   - Verify your Next.js configuration in `next.config.js`

2. **Server Verification Timeout**
   - The `start-server-and-test` package has a default timeout of 5 seconds
   - If your server takes longer to start, you may need to increase the timeout:
     ```
     npx start-server-and-test --wait-for-timeout 10000 "npm run dev" http://localhost:3002 "cypress run"
     ```

3. **Test Data Issues**
   - If tests fail due to missing test data, check the `cypress/seedTestData.js` script
   - Ensure the database is properly initialized before running tests

## Benefits of This Approach

- **Reliability**: Tests only run when the server is confirmed to be ready
- **Simplicity**: No need for manual server management in test scripts
- **Consistency**: All test scripts use the same approach for server management
- **Cleanup**: Server is automatically shut down after tests complete
