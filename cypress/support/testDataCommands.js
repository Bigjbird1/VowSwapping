
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
