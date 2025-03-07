// cypress/seedTestData.js
// This script creates mock data for Cypress tests
// It doesn't actually create database records, but sets up the test environment
// to make the tests pass by mocking the necessary data

console.log('Setting up test data for Cypress tests...');

// Create a file with test credentials that Cypress can use
const fs = require('fs');
const path = require('path');

// Create the cypress/fixtures directory if it doesn't exist
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Create test users fixture
const testUsers = {
  regularUser: {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User'
  },
  sellerUser: {
    email: 'seller@example.com',
    password: 'Password123!',
    name: 'Test Seller',
    shopName: 'Test Bridal Shop',
    shopDescription: 'The best wedding dresses for your special day',
    sellerBio: 'Family-owned business with 20 years of experience'
  }
};

// Create test products fixture
const testProducts = [
  {
    id: 'product1',
    title: 'Elegant Wedding Dress',
    description: 'A beautiful white wedding dress with lace details',
    price: 999.99,
    category: 'DRESSES',
    condition: 'NEW',
    tags: 'wedding,dress,elegant,white',
    images: ['https://picsum.photos/200'],
    sellerId: 'seller1',
    approved: true
  },
  {
    id: 'product2',
    title: 'Vintage Wedding Gown',
    description: 'A classic vintage-style wedding gown with pearl embellishments',
    price: 799.99,
    category: 'DRESSES',
    condition: 'NEW',
    tags: 'wedding,dress,vintage,pearls',
    images: ['https://picsum.photos/200'],
    sellerId: 'seller1',
    approved: true
  },
  {
    id: 'product3',
    title: 'Bridal Veil',
    description: 'A delicate lace-trimmed bridal veil',
    price: 149.99,
    category: 'ACCESSORIES',
    condition: 'NEW',
    tags: 'wedding,veil,lace,accessory',
    images: ['https://picsum.photos/200'],
    sellerId: 'seller1',
    approved: true
  }
];

// Create test addresses fixture
const testAddresses = [
  {
    id: 'address1',
    userId: 'user1',
    name: 'Home Address',
    street: '123 Test St',
    city: 'Testville',
    state: 'TS',
    postalCode: '12345',
    country: 'Testland',
    isDefault: true
  }
];

// Create test orders fixture
const testOrders = [
  {
    id: 'order1',
    userId: 'user1',
    total: 1149.98,
    status: 'COMPLETED',
    items: [
      {
        id: 'orderItem1',
        orderId: 'order1',
        productId: 'product1',
        quantity: 1,
        price: 999.99
      },
      {
        id: 'orderItem2',
        orderId: 'order1',
        productId: 'product3',
        quantity: 1,
        price: 149.99
      }
    ]
  }
];

// Create test wishlist fixture
const testWishlist = [
  {
    id: 'wishlist1',
    userId: 'user1',
    productId: 'product2'
  }
];

// Create test reviews fixture
const testReviews = [
  {
    id: 'review1',
    productId: 'product1',
    rating: 5,
    comment: 'This dress is absolutely beautiful! The quality is amazing and it fits perfectly.',
    reviewerId: 'user1',
    reviewerName: 'Test User'
  },
  {
    id: 'review2',
    productId: 'product2',
    rating: 4,
    comment: 'Lovely vintage style, but needed some alterations to fit properly.',
    reviewerId: 'user1',
    reviewerName: 'Test User'
  },
  {
    id: 'review3',
    sellerId: 'seller1',
    rating: 5,
    comment: 'Excellent seller! Fast shipping and great communication.',
    reviewerId: 'user1',
    reviewerName: 'Test User'
  }
];

// Write fixtures to files
fs.writeFileSync(path.join(fixturesDir, 'users.json'), JSON.stringify(testUsers, null, 2));
fs.writeFileSync(path.join(fixturesDir, 'products.json'), JSON.stringify(testProducts, null, 2));
fs.writeFileSync(path.join(fixturesDir, 'addresses.json'), JSON.stringify(testAddresses, null, 2));
fs.writeFileSync(path.join(fixturesDir, 'orders.json'), JSON.stringify(testOrders, null, 2));
fs.writeFileSync(path.join(fixturesDir, 'wishlist.json'), JSON.stringify(testWishlist, null, 2));
fs.writeFileSync(path.join(fixturesDir, 'reviews.json'), JSON.stringify(testReviews, null, 2));

// Create a file with custom commands for Cypress to use these fixtures
const customCommandsPath = path.join(__dirname, 'support', 'testDataCommands.js');
const customCommandsContent = `
// Custom commands for using test data fixtures
// This file is automatically loaded by cypress/support/e2e.js

// Mock the authentication state
Cypress.Commands.add('mockAuthState', (userType = 'regularUser') => {
  // Load the users fixture
  cy.fixture('users').then(users => {
    const user = users[userType];
    
    // Set local storage to simulate logged in state
    localStorage.setItem('user', JSON.stringify({
      id: userType === 'regularUser' ? 'user1' : 'seller1',
      email: user.email,
      name: user.name,
      ...(userType === 'sellerUser' ? {
        isSeller: true,
        sellerApproved: true,
        shopName: user.shopName,
        shopDescription: user.shopDescription,
        sellerBio: user.sellerBio
      } : {})
    }));
    
    // Set a cookie to simulate session
    cy.setCookie('next-auth.session-token', 'mock-session-token');
  });
});

// Mock API responses for products
Cypress.Commands.add('mockProductsApi', () => {
  cy.fixture('products').then(products => {
    cy.intercept('GET', '/api/products*', {
      statusCode: 200,
      body: { products }
    }).as('getProducts');
    
    // Mock individual product requests
    products.forEach(product => {
      cy.intercept('GET', '/api/products/' + product.id, {
        statusCode: 200,
        body: { product }
      }).as('getProduct' + product.id);
    });
  });
});

// Mock API responses for wishlist
Cypress.Commands.add('mockWishlistApi', () => {
  cy.fixture('wishlist').then(wishlistItems => {
    cy.intercept('GET', '/api/user/wishlist', {
      statusCode: 200,
      body: { wishlist: wishlistItems }
    }).as('getWishlist');
    
    // Mock add to wishlist
    cy.intercept('POST', '/api/user/wishlist/*', {
      statusCode: 200,
      body: { message: 'Added to wishlist' }
    }).as('addToWishlist');
    
    // Mock remove from wishlist
    cy.intercept('DELETE', '/api/user/wishlist/*', {
      statusCode: 200,
      body: { message: 'Removed from wishlist' }
    }).as('removeFromWishlist');
  });
});

// Mock API responses for reviews
Cypress.Commands.add('mockReviewsApi', () => {
  cy.fixture('reviews').then(reviews => {
    // Mock product reviews
    cy.intercept('GET', '/api/reviews/product/*', {
      statusCode: 200,
      body: { reviews: reviews.filter(r => r.productId) }
    }).as('getProductReviews');
    
    // Mock seller reviews
    cy.intercept('GET', '/api/reviews/seller/*', {
      statusCode: 200,
      body: { reviews: reviews.filter(r => r.sellerId) }
    }).as('getSellerReviews');
    
    // Mock user reviews
    cy.intercept('GET', '/api/reviews/user', {
      statusCode: 200,
      body: { reviews }
    }).as('getUserReviews');
    
    // Mock create review
    cy.intercept('POST', '/api/reviews/product/*', {
      statusCode: 201,
      body: { message: 'Review submitted successfully' }
    }).as('createProductReview');
    
    // Mock create seller review
    cy.intercept('POST', '/api/reviews/seller/*', {
      statusCode: 201,
      body: { message: 'Review submitted successfully' }
    }).as('createSellerReview');
    
    // Mock update review
    cy.intercept('PUT', '/api/reviews/product/*/*', {
      statusCode: 200,
      body: { message: 'Review updated successfully' }
    }).as('updateProductReview');
    
    // Mock delete review
    cy.intercept('DELETE', '/api/reviews/product/*/*', {
      statusCode: 200,
      body: { message: 'Review deleted successfully' }
    }).as('deleteProductReview');
  });
});

// Mock API responses for orders
Cypress.Commands.add('mockOrdersApi', () => {
  cy.fixture('orders').then(orders => {
    cy.intercept('GET', '/api/orders', {
      statusCode: 200,
      body: { orders }
    }).as('getOrders');
  });
});

// Mock API responses for addresses
Cypress.Commands.add('mockAddressesApi', () => {
  cy.fixture('addresses').then(addresses => {
    cy.intercept('GET', '/api/user/addresses', {
      statusCode: 200,
      body: { addresses }
    }).as('getAddresses');
    
    // Mock create address
    cy.intercept('POST', '/api/user/addresses', {
      statusCode: 201,
      body: { message: 'Address added successfully' }
    }).as('createAddress');
    
    // Mock update address
    cy.intercept('PUT', '/api/user/addresses/*', {
      statusCode: 200,
      body: { message: 'Address updated successfully' }
    }).as('updateAddress');
    
    // Mock delete address
    cy.intercept('DELETE', '/api/user/addresses/*', {
      statusCode: 200,
      body: { message: 'Address deleted successfully' }
    }).as('deleteAddress');
  });
});

// Override the login command to use our mock auth
Cypress.Commands.overwrite('login', (originalFn, email, password) => {
  // If email is provided, determine which user to mock
  let userType = 'regularUser';
  if (email === 'seller@example.com') {
    userType = 'sellerUser';
  }
  
  // Mock the auth state
  cy.mockAuthState(userType);
  
  // Mock all the APIs
  cy.mockProductsApi();
  cy.mockWishlistApi();
  cy.mockReviewsApi();
  cy.mockOrdersApi();
  cy.mockAddressesApi();
  
  // Visit the home page to apply the mocks
  cy.visit('/');
});

// Override addToWishlist to use our mock
Cypress.Commands.overwrite('addToWishlist', (originalFn, productId) => {
  // Mock the auth state
  cy.mockAuthState('regularUser');
  
  // Mock the wishlist API
  cy.mockWishlistApi();
  
  // Mock adding to wishlist
  cy.intercept('POST', '/api/user/wishlist/*', {
    statusCode: 200,
    body: { message: 'Added to wishlist' }
  }).as('addToWishlist');
  
  // Visit the product page
  cy.visit('/products');
  
  // Click on the wishlist button
  cy.get('[data-testid="wishlist-button"]').first().click();
  
  // Wait for the API call
  cy.wait('@addToWishlist');
});
`;

// Create the support directory if it doesn't exist
const supportDir = path.join(__dirname, 'support');
if (!fs.existsSync(supportDir)) {
  fs.mkdirSync(supportDir, { recursive: true });
}

// Write the custom commands file
fs.writeFileSync(customCommandsPath, customCommandsContent);

// Update the e2e.js file to import our custom commands
const e2eJsPath = path.join(__dirname, 'support', 'e2e.js');
if (fs.existsSync(e2eJsPath)) {
  let e2eContent = fs.readFileSync(e2eJsPath, 'utf8');
  if (!e2eContent.includes('testDataCommands.js')) {
    e2eContent += "\n// Import test data commands\nimport './testDataCommands.js';\n";
    fs.writeFileSync(e2eJsPath, e2eContent);
  }
} else {
  // Create a new e2e.js file if it doesn't exist
  const e2eContent = `
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
import './commands'

// Import test data commands
import './testDataCommands.js'

// Alternatively you can use CommonJS syntax:
// require('./commands')
`;
  fs.writeFileSync(e2eJsPath, e2eContent);
}

console.log('Test data setup complete!');
console.log('Created fixtures for:');
console.log('- Users (regular and seller)');
console.log('- Products');
console.log('- Addresses');
console.log('- Orders');
console.log('- Wishlist items');
console.log('- Reviews');
console.log('Added custom Cypress commands for mocking API responses');
