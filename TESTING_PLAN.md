# VowSwap MVP Testing Plan

This document outlines our comprehensive testing strategy to ensure the VowSwap MVP is functioning correctly before proceeding with additional feature development.

## Initial Phase

### 1. Automated Testing Setup

#### Unit Testing with Jest

```bash
# Install Jest and related dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Add to package.json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}

# Create Jest config
```

Create `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  }
};
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

#### End-to-End Testing with Cypress

```bash
# Install Cypress
npm install --save-dev cypress

# Add to package.json
"scripts": {
  "cypress": "cypress open",
  "cypress:headless": "cypress run"
}

# Initialize Cypress
npx cypress open
```

### 2. Critical Path Testing

Create end-to-end tests for the most critical user flows:

#### User Authentication Flow

Create `cypress/e2e/auth.cy.js`:

```javascript
describe('Authentication Flow', () => {
  it('should allow a user to sign up', () => {
    cy.visit('/auth/signup');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to verification page or dashboard
    cy.url().should('include', '/auth/verify-email');
  });

  it('should allow a user to sign in', () => {
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/');
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('should allow a user to reset password', () => {
    cy.visit('/auth/forgot-password');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    
    // Verify success message
    cy.contains('Reset link sent').should('be.visible');
  });
});
```

#### Shopping Cart and Checkout Flow

Create `cypress/e2e/checkout.cy.js`:

```javascript
describe('Shopping Cart and Checkout Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
  });

  it('should add a product to cart', () => {
    cy.visit('/products');
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="quantity-selector"]').should('have.value', '1');
    cy.get('[data-testid="add-to-cart-button"]').click();
    
    // Verify cart updated
    cy.get('[data-testid="cart-count"]').should('contain', '1');
  });

  it('should proceed through checkout', () => {
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill shipping info
    cy.get('select[name="addressId"]').select('new');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="street"]').type('123 Test St');
    cy.get('input[name="city"]').type('Test City');
    cy.get('input[name="state"]').type('Test State');
    cy.get('input[name="postalCode"]').type('12345');
    cy.get('input[name="country"]').type('Test Country');
    cy.get('button').contains('Continue to Payment').click();
    
    // Verify redirect to payment page
    cy.url().should('include', '/checkout');
    cy.contains('Payment').should('be.visible');
    
    // Mock Stripe payment (in a real test, you'd use Stripe test mode)
    cy.get('input[name="cardNumber"]').type('4242424242424242');
    cy.get('input[name="cardExpiry"]').type('1230');
    cy.get('input[name="cardCvc"]').type('123');
    cy.get('button').contains('Pay').click();
    
    // Verify success page
    cy.url().should('include', '/checkout/success');
  });
});
```

#### Seller Registration and Product Management

Create `cypress/e2e/seller.cy.js`:

```javascript
describe('Seller Functionality', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type('seller@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
  });

  it('should allow user to register as seller', () => {
    cy.visit('/seller/register');
    cy.get('input[name="shopName"]').type('Test Shop');
    cy.get('textarea[name="shopDescription"]').type('This is a test shop');
    cy.get('textarea[name="sellerBio"]').type('I am a test seller');
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to pending page
    cy.url().should('include', '/seller/pending');
  });

  it('should allow seller to create a product', () => {
    // Assuming seller is approved
    cy.visit('/seller/dashboard');
    cy.get('[data-testid="create-product"]').click();
    
    cy.get('input[name="title"]').type('Test Product');
    cy.get('textarea[name="description"]').type('This is a test product');
    cy.get('input[name="price"]').type('99.99');
    cy.get('select[name="category"]').select('ACCESSORIES');
    cy.get('select[name="condition"]').select('NEW');
    cy.get('input[name="tags"]').type('test,product,new');
    
    // Mock file upload
    cy.get('input[type="file"]').attachFile('test-image.jpg');
    
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to products page
    cy.url().should('include', '/seller/products');
  });
});
```

### 3. Security Testing

#### Authentication and Authorization Testing

Create `__tests__/security/auth.test.js`:

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInForm from '@/components/auth/SignInForm';
import { signIn } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' }))
}));

describe('Authentication Security', () => {
  it('should validate email format', async () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('should enforce password requirements', async () => {
    render(<SignInForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });
});
```

#### API Security Testing

Create `__tests__/security/api.test.js`:

```javascript
import { createMocks } from 'node-mocks-http';
import userProfileHandler from '@/app/api/user/profile/route';
import { getServerSession } from 'next-auth/next';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

describe('API Security', () => {
  it('should reject unauthenticated requests to protected endpoints', async () => {
    // Mock unauthenticated session
    getServerSession.mockResolvedValueOnce(null);
    
    const { req, res } = createMocks({
      method: 'GET'
    });
    
    await userProfileHandler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('unauthorized')
      })
    );
  });

  it('should prevent accessing other users data', async () => {
    // Mock authenticated session
    getServerSession.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'user1@example.com' }
    });
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'user-2' }
    });
    
    await userProfileHandler(req, res);
    
    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('forbidden')
      })
    );
  });
});
```

## Secondary Phase

### 1. Performance Testing

#### Lighthouse CI Setup

```bash
# Install Lighthouse CI
npm install --save-dev @lhci/cli

# Add to package.json
"scripts": {
  "lighthouse": "lhci autorun"
}
```

Create `.lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/products/1',
        'http://localhost:3000/cart',
        'http://localhost:3000/checkout'
      ],
      numberOfRuns: 3
    },
    upload: {
      target: 'temporary-public-storage'
    },
    assert: {
      preset: 'lighthouse:recommended'
    }
  }
};
```

#### Load Testing with k6

Install k6 (https://k6.io/docs/getting-started/installation/)

Create `load-tests/product-page.js`:

```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'page loads in less than 1s': (r) => r.timings.duration < 1000,
  });
  sleep(1);
}
```

### 2. Accessibility Testing

#### Automated Accessibility Testing

```bash
# Install axe-core for accessibility testing
npm install --save-dev axe-core @axe-core/react
```

Create `cypress/e2e/accessibility.cy.js`:

```javascript
describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.injectAxe();
  });

  it('Home page should be accessible', () => {
    cy.visit('/');
    cy.checkA11y();
  });

  it('Product listing page should be accessible', () => {
    cy.visit('/products');
    cy.checkA11y();
  });

  it('Product detail page should be accessible', () => {
    cy.visit('/products/1');
    cy.checkA11y();
  });

  it('Cart page should be accessible', () => {
    cy.visit('/cart');
    cy.checkA11y();
  });

  it('Checkout page should be accessible', () => {
    cy.visit('/checkout');
    cy.checkA11y();
  });
});
```

### 3. Cross-Browser Testing

#### BrowserStack Integration

```bash
# Install BrowserStack CLI
npm install --save-dev browserstack-cypress-cli

# Initialize BrowserStack configuration
npx browserstack-cypress init
```

Edit `browserstack.json`:

```json
{
  "auth": {
    "username": "${BROWSERSTACK_USERNAME}",
    "access_key": "${BROWSERSTACK_ACCESS_KEY}"
  },
  "browsers": [
    {
      "browser": "chrome",
      "os": "Windows 10",
      "versions": ["latest", "latest-1"]
    },
    {
      "browser": "firefox",
      "os": "Windows 10",
      "versions": ["latest", "latest-1"]
    },
    {
      "browser": "edge",
      "os": "Windows 10",
      "versions": ["latest"]
    },
    {
      "browser": "safari",
      "os": "OS X Monterey",
      "versions": ["latest"]
    }
  ],
  "run_settings": {
    "cypress_config_file": "cypress.config.js",
    "project_name": "VowSwap",
    "build_name": "MVP Testing",
    "exclude": [],
    "parallels": 1,
    "npm_dependencies": {},
    "package_config_options": {}
  },
  "connection_settings": {
    "local": true,
    "local_identifier": null,
    "local_mode": null,
    "local_config_file": null
  },
  "disable_usage_reporting": false
}
```

## Implementation Checklist

### Initial Phase

- [ ] Set up Jest for unit testing
- [ ] Set up Cypress for end-to-end testing
- [ ] Implement critical path tests for authentication
- [ ] Implement critical path tests for shopping cart and checkout
- [ ] Implement critical path tests for seller functionality
- [ ] Implement security tests for authentication
- [ ] Implement security tests for API endpoints

### Secondary Phase

- [ ] Set up Lighthouse CI for performance testing
- [ ] Implement load testing with k6
- [ ] Set up accessibility testing with axe-core
- [ ] Implement cross-browser testing with BrowserStack

## Running the Tests

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run cypress

# Run performance tests
npm run lighthouse

# Run load tests
k6 run load-tests/product-page.js

# Run cross-browser tests
npx browserstack-cypress run
```

## Continuous Integration

For a complete testing workflow, we recommend setting up GitHub Actions to run these tests automatically on each pull request and merge to main.

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run cypress:headless
      - run: npm run lighthouse
```

## Next Steps

After implementing and running these tests, we should:

1. Fix any issues identified during testing
2. Document test results and any known limitations
3. Set up monitoring for production
4. Proceed with implementing the features planned for Phase 4.2 and beyond
