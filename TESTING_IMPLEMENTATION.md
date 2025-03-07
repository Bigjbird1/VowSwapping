# VowSwap Testing Implementation

This document outlines the comprehensive testing implementation for the VowSwap e-commerce platform, covering all critical user flows and functionality.

## Testing Strategy

We've implemented a multi-layered testing strategy that includes:

1. **Component Tests** - Testing individual UI components in isolation using Jest and React Testing Library
2. **API Tests** - Testing API endpoints and their responses using Jest
3. **Database Integration Tests** - Testing database models, relationships, and operations
4. **Security Tests** - Testing authentication, authorization, and other security aspects
5. **End-to-End Tests** - Testing complete user flows using Cypress

## Test Coverage

### 1. Authentication & User Management

- **Component Tests**:
  - SignUpForm - Form validation, submission, and error handling
  - SignInForm - Login validation and error states
  - PasswordResetForm - Request reset and reset password forms
  - EmailVerification - Verification success, failure, and loading states

- **API Tests**:
  - Register API - User creation, validation, and error handling
  - Verify Email API - Email verification with valid and invalid tokens
  - Forgot Password API - Password reset request handling
  - Reset Password API - Password reset with valid and invalid tokens

- **End-to-End Tests**:
  - Complete Authentication Flow - Registration, verification, and login
  - Password Reset Flow - Requesting and completing password reset
  - User Profile Management - Updating profile information
  - Address Management - Adding, editing, and deleting addresses

### 2. Shopping Experience

- **Component Tests**:
  - ProductCard - Rendering product information and interactions
  - ProductGrid - Displaying multiple products correctly
  - ProductFilters - Filtering functionality
  - AddToCartButton - Adding products to cart
  - WishlistButton - Adding/removing products from wishlist

- **API Tests**:
  - Products API - Listing, filtering, and retrieving product details
  - Cart API - Adding, updating, and removing items

- **End-to-End Tests**:
  - Product Browsing - Navigating product listings and applying filters
  - Product Detail View - Viewing product information
  - Add to Cart - Adding products to cart with quantity selection
  - Cart Management - Updating quantities and removing items

### 3. Checkout Process

- **Component Tests**:
  - StripePaymentForm - Payment form validation and submission

- **API Tests**:
  - Orders API - Creating and retrieving orders
  - Payments API - Creating payment intents and handling webhooks

- **End-to-End Tests**:
  - Checkout Flow - From cart to order completion
  - Address Selection - Choosing existing or adding new addresses
  - Payment Processing - Successful and failed payment scenarios

### 4. Seller Functionality

- **API Tests**:
  - Seller Registration API - Becoming a seller
  - Seller Products API - Managing seller's products
  - Seller Stats API - Retrieving seller statistics

- **End-to-End Tests**:
  - Seller Registration - Applying to become a seller
  - Seller Dashboard - Accessing seller statistics
  - Product Management - Creating, editing, and deleting products
  - Shop Profile Management - Updating shop information

### 5. Wishlist & Reviews

- **Component Tests**:
  - ReviewForm - Creating and editing reviews
  - StarRating - Rating selection and display
  - ReviewCard - Displaying review information

- **API Tests**:
  - Wishlist API - Adding, checking, and removing wishlist items
  - Reviews API - Creating, updating, and deleting reviews

- **End-to-End Tests**:
  - Wishlist Management - Adding and removing products
  - Product Reviews - Creating, editing, and deleting product reviews
  - Seller Reviews - Creating, editing, and deleting seller reviews
  - Review Filtering - Filtering reviews by rating and date

### 6. Database Integration

- **Model Tests**:
  - User Model - Creating, updating, and validating users
  - Product Model - Product creation and relationships
  - Order Model - Order creation and relationships
  - Address Model - Address management
  - Wishlist Model - Wishlist functionality
  - Review Model - Review creation and relationships

- **Migration Tests**:
  - Schema Validation - Ensuring migrations apply correctly
  - Data Integrity - Maintaining data through migrations

- **Data Persistence Tests**:
  - Session Persistence - Maintaining user state across sessions

## Test Files Structure

### Component Tests (Jest)

1. **Authentication Components**
   - `__tests__/components/SignUpForm.test.jsx`
   - `__tests__/components/SignInForm.test.jsx`
   - `__tests__/components/PasswordResetForm.test.jsx`
   - `__tests__/components/EmailVerification.test.jsx`

2. **Product Components**
   - `__tests__/components/ProductCard.test.jsx`
   - `__tests__/components/ProductGrid.test.jsx`
   - `__tests__/components/ProductFilters.test.jsx`
   - `__tests__/components/AddToCartButton.test.jsx`
   - `__tests__/components/WishlistButton.test.jsx`

3. **Checkout Components**
   - `__tests__/components/StripePaymentForm.test.jsx`

4. **Review Components**
   - `__tests__/components/ReviewForm.test.jsx`
   - `__tests__/components/StarRating.test.jsx`
   - `__tests__/components/ReviewCard.test.jsx`

### API Tests (Jest)

1. **Authentication API**
   - `__tests__/api/auth.test.js`

2. **Product API**
   - `__tests__/api/products.test.js`

3. **User API**
   - `__tests__/api/users.test.js`

4. **Order API**
   - `__tests__/api/orders.test.js`

5. **Seller API**
   - `__tests__/api/sellers.test.js`

6. **Review API**
   - `__tests__/api/reviews.test.js`

7. **Wishlist API**
   - `__tests__/api/wishlist.test.js`

### Database Integration Tests (Jest)

1. **Prisma Models**
   - `__tests__/database/prisma-models.test.js`

2. **Database Migrations**
   - `__tests__/database/migrations.test.js`

3. **Data Persistence**
   - `__tests__/database/data-persistence.test.js`

### Security Tests (Jest)

1. **Authentication Security**
   - `__tests__/security/auth.test.js`

### End-to-End Tests (Cypress)

1. **Authentication Flows**
   - `cypress/e2e/auth.cy.js`
   - `cypress/e2e/auth-flow.cy.js`

2. **User Profile Management**
   - `cypress/e2e/profile-management.cy.js`

3. **Shopping Experience**
   - `cypress/e2e/shopping-experience.cy.js`

4. **Checkout Process**
   - `cypress/e2e/checkout.cy.js`

5. **Seller Functionality**
   - `cypress/e2e/seller.cy.js`

6. **Wishlist & Reviews**
   - `cypress/e2e/wishlist-reviews.cy.js`

7. **Support Files**
   - `cypress/support/commands.js`
   - `cypress/support/e2e.js`

## Custom Commands

The test suite uses several custom Cypress commands to simplify test implementation:

- `cy.login(email, password)` - Logs in a user with the specified credentials
- `cy.addToCart(productId)` - Adds a product to the cart
- `cy.addToWishlist(productId)` - Adds a product to the wishlist
- `cy.createTestAddress()` - Creates a test address for the current user
- `cy.createTestReview(productId, rating, comment)` - Creates a test review for a product
- `cy.createTestSellerReview(sellerId, rating, comment)` - Creates a test review for a seller

## Running the Tests

### Component and API Tests (Jest)

To run all Jest tests:

```bash
npm run test
```

To run specific test categories:

```bash
# Run component tests
npm run test:components

# Run API tests
npm run test:api

# Run database tests
npm run test:db

# Run security tests
npm run test:security
```

To run a specific test file:

```bash
npx jest __tests__/components/ProductCard.test.jsx
```

To run tests with coverage report:

```bash
npm run test:coverage
```

### End-to-End Tests (Cypress)

To open the Cypress Test Runner for interactive testing:

```bash
npm run cypress:open
```

To run all Cypress tests headlessly:

```bash
npm run cypress:run
```

To run specific Cypress test files:

```bash
# Run authentication tests
npm run test:e2e:auth

# Run shopping experience tests
npm run test:e2e:shopping

# Run checkout tests
npm run test:e2e:checkout

# Run seller tests
npm run test:e2e:seller

# Run wishlist and reviews tests
npm run test:e2e:wishlist-reviews
```

### Running All Tests

To run all tests (Jest and Cypress):

```bash
npm run test:all
```

## Test Environment Setup

### Test Database

The database tests use a separate test database to avoid interfering with the development database:

1. The test database is configured in `.env.test`
2. Tests run migrations automatically to ensure the schema is up-to-date
3. Test data is cleaned up after tests complete

### Test User Credentials

For tests that require existing users:

1. Regular test user: `test@example.com` / `Password123!`
2. Seller test user: `seller@example.com` / `Password123!` (with approved seller status)

You can create these users using the provided setup scripts:

```bash
npm run setup:test-users
```

### Stripe Test Mode

For payment processing tests, Stripe is configured in test mode:

1. Test API keys are set in `.env.test`
2. Webhook events are simulated using Stripe's test events
3. Test card numbers are used for payment simulation:
   - Successful payment: `4242 4242 4242 4242`
   - Declined payment: `4000 0000 0000 0002`

### Email Testing

For tests involving email verification or password reset:

1. In a production-like environment, consider using a service like [Mailhog](https://github.com/mailhog/MailHog) to capture and inspect emails
2. For local development, the tests are configured to bypass email verification or use environment variables to control the behavior

## Test Data Management

The tests are designed to be idempotent and avoid test data conflicts:

- Component tests use mock data and don't interact with the database
- API tests use mocked Prisma client to avoid database interactions
- Database tests use transactions where possible to automatically roll back changes
- E2E tests use unique identifiers (using timestamps) for product titles, review text, etc.
- Tests clean up after themselves when possible (e.g., deleting created reviews)
- Tests verify the state before and after operations to ensure correct behavior

## Continuous Integration

The test suite is configured to run in CI/CD pipelines:

1. GitHub Actions workflow runs all tests on pull requests
2. Test results are reported as GitHub checks
3. Code coverage reports are generated and uploaded as artifacts

## Troubleshooting Common Issues

### Jest Tests

- **Module not found errors**: Ensure the module paths in your tests match the actual file structure
- **Mock issues**: Check that all external dependencies are properly mocked
- **Timeout errors**: Increase the timeout for tests that involve async operations

### Cypress Tests

- **Element not found errors**: Use `cy.contains()` or `cy.get()` with appropriate selectors
- **Timing issues**: Use `cy.wait()` or `cy.should()` with appropriate assertions
- **Authentication issues**: Ensure the test users exist and have the correct permissions
- **Database connection errors**: Verify test database configuration in `.env.test`
- **Stripe API errors**: Check that Stripe test keys are valid and properly configured

## Future Improvements

1. **API Mocking**: Expand use of `cy.intercept()` to mock API responses for more reliable tests
2. **Visual Testing**: Add visual regression testing for UI components
3. **Performance Testing**: Implement performance metrics collection during tests
4. **Accessibility Testing**: Expand accessibility testing coverage
5. **Cross-Browser Testing**: Configure tests to run on multiple browsers
6. **Load Testing**: Add load testing for critical API endpoints
7. **Security Scanning**: Integrate automated security scanning tools

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/guides/overview/why-cypress)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Stripe Testing Documentation](https://stripe.com/docs/testing)
