describe('Wishlist & Reviews Functionality', () => {
  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  describe('Wishlist Functionality', () => {
    beforeEach(() => {
      // Login before each test
      cy.login(testUser.email, testUser.password);
    });

    it('should add a product to wishlist from product listing', () => {
      cy.visit('/products');
      
      // Find the first product's wishlist button
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="wishlist-button"]').click();
      });
      
      // Verify success message
      cy.contains('Added to wishlist').should('be.visible');
    });

    it('should add a product to wishlist from product detail page', () => {
      cy.visit('/products');
      
      // Click on first product
      cy.get('[data-testid="product-card"]').first().click();
      
      // Wait for page to load
      cy.wait(2000);
      
      // Click wishlist button on product detail page
      cy.get('[data-testid="wishlist-button"]').click();
      
      // Verify success message
      cy.contains('Added to wishlist').should('be.visible');
    });

    it('should view wishlist page', () => {
      // Add a product to wishlist first
      cy.addToWishlist();
      
      // Navigate to wishlist page
      cy.visit('/profile');
      cy.contains('Wishlist').click();
      
      // Verify wishlist page
      cy.url().should('include', '/profile/wishlist');
      cy.get('[data-testid="wishlist-item"]').should('exist');
    });

    it('should remove a product from wishlist', () => {
      // Add a product to wishlist first
      cy.addToWishlist();
      
      // Navigate to wishlist page
      cy.visit('/profile/wishlist');
      
      // Get wishlist item count before removal
      cy.get('[data-testid="wishlist-item"]').then($items => {
        const countBefore = $items.length;
        
        // Remove product from wishlist
        cy.get('[data-testid="remove-from-wishlist"]').first().click();
        
        // Verify product was removed
        cy.contains('Removed from wishlist').should('be.visible');
        
        // If there was only one item, check for empty wishlist message
        if (countBefore === 1) {
          cy.contains('Your wishlist is empty').should('be.visible');
        } else {
          // Otherwise, check that the count decreased
          cy.get('[data-testid="wishlist-item"]').should('have.length', countBefore - 1);
        }
      });
    });

    it('should add product to cart from wishlist', () => {
      // Add a product to wishlist first
      cy.addToWishlist();
      
      // Navigate to wishlist page
      cy.visit('/profile/wishlist');
      
      // Add to cart from wishlist
      cy.get('[data-testid="add-to-cart-from-wishlist"]').first().click();
      
      // Verify product was added to cart
      cy.contains('Added to cart').should('be.visible');
      
      // Verify cart count increased
      cy.get('[data-testid="cart-count"]').should('exist');
    });
  });

  describe('Product Reviews', () => {
    beforeEach(() => {
      // Login before each test
      cy.login(testUser.email, testUser.password);
    });

    it('should view product reviews on product detail page', () => {
      cy.visit('/products');
      
      // Click on first product
      cy.get('[data-testid="product-card"]').first().click();
      
      // Wait for page to load
      cy.wait(2000);
      
      // Verify reviews section exists
      cy.get('[data-testid="product-reviews"]').should('exist');
    });

    it('should create a product review', () => {
      cy.visit('/products');
      
      // Click on first product
      cy.get('[data-testid="product-card"]').first().click();
      
      // Wait for page to load
      cy.wait(2000);
      
      // Click write review button
      cy.get('[data-testid="write-review-button"]').click();
      
      // Generate unique review text
      const reviewText = `This is a great product! Highly recommended. ${Date.now()}`;
      
      // Fill review form
      cy.get('[data-testid="star-rating-input"]').within(() => {
        cy.get('[data-testid="star-4"]').click(); // 4-star rating
      });
      cy.get('textarea[name="comment"]').type(reviewText);
      
      // Submit review
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Review submitted successfully').should('be.visible');
      
      // Verify review appears in the list
      cy.get('[data-testid="review-list"]').contains(reviewText).should('be.visible');
    });

    it('should edit a product review', () => {
      // Navigate to user's reviews
      cy.visit('/profile/reviews');
      
      // Click edit on the first review
      cy.get('[data-testid="edit-review-button"]').first().click();
      
      // Generate unique updated review text
      const updatedReview = `Updated review - even better than I thought! ${Date.now()}`;
      
      // Update review
      cy.get('[data-testid="star-rating-input"]').within(() => {
        cy.get('[data-testid="star-5"]').click(); // Change to 5-star
      });
      cy.get('textarea[name="comment"]').clear().type(updatedReview);
      
      // Submit updated review
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Review updated successfully').should('be.visible');
      
      // Verify updated review appears
      cy.contains(updatedReview).should('be.visible');
    });

    it('should delete a product review', () => {
      // Navigate to user's reviews
      cy.visit('/profile/reviews');
      
      // Get review count before deletion
      cy.get('[data-testid="review-item"]').then($items => {
        const countBefore = $items.length;
        
        // Click delete on first review
        cy.get('[data-testid="delete-review-button"]').first().click();
        
        // Confirm deletion
        cy.get('[data-testid="confirm-delete-button"]').click();
        
        // Verify review was deleted
        cy.contains('Review deleted successfully').should('be.visible');
        
        // If there was only one review, check for empty reviews message
        if (countBefore === 1) {
          cy.contains('You have not written any reviews yet').should('be.visible');
        } else {
          // Otherwise, check that the count decreased
          cy.get('[data-testid="review-item"]').should('have.length', countBefore - 1);
        }
      });
    });
  });

  describe('Seller Reviews', () => {
    beforeEach(() => {
      // Login before each test
      cy.login(testUser.email, testUser.password);
    });

    it('should view seller reviews on shop page', () => {
      cy.visit('/shops');
      
      // Click on first shop
      cy.get('[data-testid="shop-card"]').first().click();
      
      // Wait for page to load
      cy.wait(2000);
      
      // Verify reviews section exists
      cy.get('[data-testid="seller-reviews"]').should('exist');
    });

    it('should create a seller review', () => {
      cy.visit('/shops');
      
      // Click on first shop
      cy.get('[data-testid="shop-card"]').first().click();
      
      // Wait for page to load
      cy.wait(2000);
      
      // Click write review button
      cy.get('[data-testid="write-seller-review-button"]').click();
      
      // Generate unique review text
      const reviewText = `Excellent seller! Fast shipping and great communication. ${Date.now()}`;
      
      // Fill review form
      cy.get('[data-testid="star-rating-input"]').within(() => {
        cy.get('[data-testid="star-5"]').click(); // 5-star rating
      });
      cy.get('textarea[name="comment"]').type(reviewText);
      
      // Submit review
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Review submitted successfully').should('be.visible');
      
      // Verify review appears in the list
      cy.get('[data-testid="seller-review-list"]').contains(reviewText).should('be.visible');
    });

    it('should edit a seller review', () => {
      // Navigate to user's reviews
      cy.visit('/profile/reviews');
      
      // Switch to seller reviews tab
      cy.get('[data-testid="seller-reviews-tab"]').click();
      
      // Click edit on the first review
      cy.get('[data-testid="edit-review-button"]').first().click();
      
      // Generate unique updated review text
      const updatedReview = `Updated seller review - good experience overall. ${Date.now()}`;
      
      // Update review
      cy.get('[data-testid="star-rating-input"]').within(() => {
        cy.get('[data-testid="star-4"]').click(); // Change to 4-star
      });
      cy.get('textarea[name="comment"]').clear().type(updatedReview);
      
      // Submit updated review
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Review updated successfully').should('be.visible');
      
      // Verify updated review appears
      cy.contains(updatedReview).should('be.visible');
    });

    it('should delete a seller review', () => {
      // Navigate to user's reviews
      cy.visit('/profile/reviews');
      
      // Switch to seller reviews tab
      cy.get('[data-testid="seller-reviews-tab"]').click();
      
      // Get review count before deletion
      cy.get('[data-testid="review-item"]').then($items => {
        const countBefore = $items.length;
        
        // Click delete on first review
        cy.get('[data-testid="delete-review-button"]').first().click();
        
        // Confirm deletion
        cy.get('[data-testid="confirm-delete-button"]').click();
        
        // Verify review was deleted
        cy.contains('Review deleted successfully').should('be.visible');
        
        // If there was only one review, check for empty reviews message
        if (countBefore === 1) {
          cy.contains('You have not written any seller reviews yet').should('be.visible');
        } else {
          // Otherwise, check that the count decreased
          cy.get('[data-testid="review-item"]').should('have.length', countBefore - 1);
        }
      });
    });
  });

  describe('Review Filtering and Sorting', () => {
    beforeEach(() => {
      // No login needed for viewing reviews
      cy.visit('/products');
      cy.get('[data-testid="product-card"]').first().click();
    });

    it('should filter reviews by rating', () => {
      // Wait for reviews to load
      cy.get('[data-testid="product-reviews"]').should('exist');
      
      // Get total review count
      cy.get('[data-testid="review-item"]').then($allReviews => {
        const totalCount = $allReviews.length;
        
        // Filter by 5-star ratings
        cy.get('[data-testid="filter-5-star"]').click();
        
        // Verify filtered reviews
        cy.get('[data-testid="review-item"]').then($filteredReviews => {
          // Either we have fewer reviews or the same number if all were 5-star
          expect($filteredReviews.length).to.be.at.most(totalCount);
          
          // Check that all visible reviews are 5-star
          cy.get('[data-testid="review-rating-5"]').should('have.length', $filteredReviews.length);
        });
      });
    });

    it('should sort reviews by date', () => {
      // Wait for reviews to load
      cy.get('[data-testid="product-reviews"]').should('exist');
      
      // Sort by newest first
      cy.get('[data-testid="sort-reviews"]').select('newest');
      
      // Verify the first review has the newest date
      cy.get('[data-testid="review-date"]').first().invoke('text').then(firstDate => {
        cy.get('[data-testid="review-date"]').last().invoke('text').then(lastDate => {
          // Convert dates to timestamps for comparison
          const firstTimestamp = new Date(firstDate).getTime();
          const lastTimestamp = new Date(lastDate).getTime();
          
          // First date should be more recent (larger timestamp)
          expect(firstTimestamp).to.be.at.least(lastTimestamp);
        });
      });
    });
  });
});
