// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to complete
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});

// Login as test user
Cypress.Commands.add('loginAsTestUser', () => {
  const { email, password } = Cypress.env('testUser');
  cy.login(email, password);
});

// Login as seller
Cypress.Commands.add('loginAsSeller', () => {
  const { email, password } = Cypress.env('sellerUser');
  cy.login(email, password);
});

// Add a product to cart
Cypress.Commands.add('addToCart', (productId, quantity = 1) => {
  cy.visit(`/products/${productId}`);
  
  if (quantity > 1) {
    cy.get('[data-testid="quantity-selector"]').clear().type(quantity.toString());
  }
  
  cy.get('[data-testid="add-to-cart-button"]').click();
  
  // Verify cart count updated
  cy.get('[data-testid="cart-count"]').should('contain', quantity);
});

// Add a product to wishlist
Cypress.Commands.add('addToWishlist', (productId) => {
  cy.visit(`/products/${productId}`);
  cy.get('[data-testid="wishlist-button"]').click();
  
  // Verify wishlist button is active
  cy.get('[data-testid="wishlist-button"]').should('have.attr', 'data-active', 'true');
});

// Create a test product (for seller)
Cypress.Commands.add('createTestProduct', (productData) => {
  const defaultProduct = {
    title: `Test Product ${Date.now()}`,
    description: 'This is a test product created by Cypress',
    price: 99.99,
    category: 'ACCESSORIES',
    condition: 'NEW',
    tags: 'test,cypress,automated',
  };
  
  const product = { ...defaultProduct, ...productData };
  
  cy.loginAsSeller();
  cy.visit('/seller/products/create');
  
  cy.get('input[name="title"]').type(product.title);
  cy.get('textarea[name="description"]').type(product.description);
  cy.get('input[name="price"]').type(product.price);
  cy.get('select[name="category"]').select(product.category);
  cy.get('select[name="condition"]').select(product.condition);
  cy.get('input[name="tags"]').type(product.tags);
  
  // Handle image upload if provided
  if (product.image) {
    cy.get('input[type="file"]').attachFile(product.image);
  }
  
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to products page
  cy.url().should('include', '/seller/products');
  
  // Return the product ID from the URL of the newly created product
  return cy.url().then(url => {
    const match = url.match(/\/products\/([^\/]+)/);
    return match ? match[1] : null;
  });
});

// Complete checkout process
Cypress.Commands.add('completeCheckout', (addressData) => {
  const defaultAddress = {
    name: 'Test User',
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
  };
  
  const address = { ...defaultAddress, ...addressData };
  
  cy.visit('/cart');
  cy.get('[data-testid="checkout-button"]').click();
  
  // Fill shipping info
  cy.get('select[name="addressId"]').select('new');
  cy.get('input[name="name"]').type(address.name);
  cy.get('input[name="street"]').type(address.street);
  cy.get('input[name="city"]').type(address.city);
  cy.get('input[name="state"]').type(address.state);
  cy.get('input[name="postalCode"]').type(address.postalCode);
  cy.get('input[name="country"]').type(address.country);
  cy.get('button').contains('Continue to Payment').click();
  
  // Mock Stripe payment
  cy.get('input[name="cardNumber"]').type('4242424242424242');
  cy.get('input[name="cardExpiry"]').type('1230');
  cy.get('input[name="cardCvc"]').type('123');
  cy.get('button').contains('Pay').click();
  
  // Verify success page
  cy.url().should('include', '/checkout/success');
});

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Import Axe for accessibility testing
import 'cypress-axe';
