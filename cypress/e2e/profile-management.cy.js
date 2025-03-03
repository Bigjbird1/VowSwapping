// User profile management tests

describe('User Profile Management', () => {
  beforeEach(() => {
    // Custom command to login (defined in cypress/support/commands.js)
    cy.login();
  });

  describe('Profile Information', () => {
    it('should allow updating user profile information', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      
      // Update profile information
      cy.get('input[name="name"]').clear().type('Updated Name');
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Profile updated successfully').should('be.visible');
      
      // Reload page and verify changes persisted
      cy.reload();
      cy.get('input[name="name"]').should('have.value', 'Updated Name');
    });

    it('should validate required fields', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      
      // Clear required field
      cy.get('input[name="name"]').clear();
      cy.get('button[type="submit"]').click();
      
      // Verify validation error
      cy.contains('Name is required').should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      
      // Enter invalid email
      cy.get('input[name="email"]').clear().type('invalid-email');
      cy.get('button[type="submit"]').click();
      
      // Verify validation error
      cy.contains('Please enter a valid email address').should('be.visible');
    });
  });

  describe('Address Management', () => {
    it('should display user addresses', () => {
      cy.visit('/profile/addresses', { failOnStatusCode: false });
      
      // Check if the addresses section is visible
      cy.get('[data-testid="addresses-list"]').should('exist');
    });

    it('should allow adding a new address', () => {
      cy.visit('/profile/addresses', { failOnStatusCode: false });
      
      // Click add new address button
      cy.contains('Add New Address').click();
      
      // Fill address form
      cy.get('input[name="name"]').type('Home Address');
      cy.get('input[name="street"]').type('123 Test Street');
      cy.get('input[name="city"]').type('Test City');
      cy.get('input[name="state"]').type('Test State');
      cy.get('input[name="postalCode"]').type('12345');
      cy.get('input[name="country"]').type('Test Country');
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Address added successfully').should('be.visible');
      
      // Verify address appears in the list
      cy.contains('Home Address').should('be.visible');
      cy.contains('123 Test Street').should('be.visible');
    });

    it('should allow editing an existing address', () => {
      cy.visit('/profile/addresses', { failOnStatusCode: false });
      
      // Ensure there's at least one address
      cy.get('[data-testid="address-card"]').should('have.length.at.least', 1);
      
      // Click edit button on first address
      cy.get('[data-testid="edit-address-button"]').first().click();
      
      // Update address
      cy.get('input[name="street"]').clear().type('456 Updated Street');
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Address updated successfully').should('be.visible');
      
      // Verify address was updated
      cy.contains('456 Updated Street').should('be.visible');
    });

    it('should allow setting an address as default', () => {
      cy.visit('/profile/addresses', { failOnStatusCode: false });
      
      // Ensure there's at least one address
      cy.get('[data-testid="address-card"]').should('have.length.at.least', 1);
      
      // Find a non-default address and set it as default
      cy.get('[data-testid="address-card"]')
        .not('.default-address')
        .first()
        .within(() => {
          cy.get('[data-testid="set-default-button"]').click();
        });
      
      // Verify success message
      cy.contains('Default address updated').should('be.visible');
      
      // Verify the address is now marked as default
      cy.get('[data-testid="address-card"]').first().should('have.class', 'default-address');
    });

    it('should allow deleting an address', () => {
      cy.visit('/profile/addresses', { failOnStatusCode: false });
      
      // Ensure there's at least one address
      cy.get('[data-testid="address-card"]').should('have.length.at.least', 1);
      
      // Get address text for verification
      cy.get('[data-testid="address-card"]').first().invoke('text').as('addressText');
      
      // Click delete button on first address
      cy.get('[data-testid="delete-address-button"]').first().click();
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      // Verify success message
      cy.contains('Address deleted successfully').should('be.visible');
      
      // Verify address no longer appears
      cy.get('@addressText').then(text => {
        cy.contains(text).should('not.exist');
      });
    });

    it('should validate required fields when adding an address', () => {
      cy.visit('/profile/addresses', { failOnStatusCode: false });
      
      // Click add new address button
      cy.contains('Add New Address').click();
      
      // Submit without filling required fields
      cy.get('button[type="submit"]').click();
      
      // Verify validation errors
      cy.contains('Name is required').should('be.visible');
      cy.contains('Street is required').should('be.visible');
      cy.contains('City is required').should('be.visible');
      cy.contains('State is required').should('be.visible');
      cy.contains('Postal code is required').should('be.visible');
      cy.contains('Country is required').should('be.visible');
    });
  });

  describe('Order History', () => {
    it('should display user order history', () => {
      cy.visit('/profile/orders', { failOnStatusCode: false });
      
      // Check if the orders section is visible
      cy.get('[data-testid="orders-list"]').should('exist');
    });

    it('should allow viewing order details', () => {
      cy.visit('/profile/orders', { failOnStatusCode: false });
      
      // Check if there are any orders
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="order-card"]').length > 0) {
          // Click on the first order to view details
          cy.get('[data-testid="order-card"]').first().click();
          
          // Verify order details are displayed
          cy.get('[data-testid="order-details"]').should('be.visible');
          cy.contains('Order Items').should('be.visible');
          cy.contains('Shipping Address').should('be.visible');
        } else {
          // Skip test if no orders exist
          cy.log('No orders found to test');
        }
      });
    });
  });

  describe('Wishlist Management', () => {
    it('should display user wishlist', () => {
      cy.visit('/profile/wishlist', { failOnStatusCode: false });
      
      // Check if the wishlist section is visible
      cy.get('[data-testid="wishlist-items"]').should('exist');
    });

    it('should allow removing items from wishlist', () => {
      cy.visit('/profile/wishlist', { failOnStatusCode: false });
      
      // Check if there are any wishlist items
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="wishlist-item"]').length > 0) {
          // Get item text for verification
          cy.get('[data-testid="wishlist-item"]').first().invoke('text').as('itemText');
          
          // Click remove button on first item
          cy.get('[data-testid="remove-from-wishlist"]').first().click();
          
          // Verify success message
          cy.contains('Item removed from wishlist').should('be.visible');
          
          // Verify item no longer appears
          cy.get('@itemText').then(text => {
            cy.contains(text).should('not.exist');
          });
        } else {
          // Skip test if no wishlist items exist
          cy.log('No wishlist items found to test');
        }
      });
    });
  });

  describe('Reviews Management', () => {
    it('should display user reviews', () => {
      cy.visit('/profile/reviews', { failOnStatusCode: false });
      
      // Check if the reviews section is visible
      cy.get('[data-testid="user-reviews"]').should('exist');
    });

    it('should allow editing a review', () => {
      cy.visit('/profile/reviews', { failOnStatusCode: false });
      
      // Check if there are any reviews
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="review-item"]').length > 0) {
          // Click edit button on first review
          cy.get('[data-testid="edit-review-button"]').first().click();
          
          // Update review
          cy.get('textarea[name="comment"]').clear().type('Updated review comment');
          cy.get('button[type="submit"]').click();
          
          // Verify success message
          cy.contains('Review updated successfully').should('be.visible');
          
          // Verify review was updated
          cy.contains('Updated review comment').should('be.visible');
        } else {
          // Skip test if no reviews exist
          cy.log('No reviews found to test');
        }
      });
    });

    it('should allow deleting a review', () => {
      cy.visit('/profile/reviews', { failOnStatusCode: false });
      
      // Check if there are any reviews
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="review-item"]').length > 0) {
          // Get review text for verification
          cy.get('[data-testid="review-item"]').first().invoke('text').as('reviewText');
          
          // Click delete button on first review
          cy.get('[data-testid="delete-review-button"]').first().click();
          
          // Confirm deletion
          cy.get('[data-testid="confirm-delete-button"]').click();
          
          // Verify success message
          cy.contains('Review deleted successfully').should('be.visible');
          
          // Verify review no longer appears
          cy.get('@reviewText').then(text => {
            cy.contains(text).should('not.exist');
          });
        } else {
          // Skip test if no reviews exist
          cy.log('No reviews found to test');
        }
      });
    });
  });
});
