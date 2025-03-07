describe('Seller Functionality', () => {
  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };
  
  // Test seller credentials
  const testSeller = {
    email: 'seller@example.com',
    password: 'Password123!'
  };
  
  // Test shop data
  const testShop = {
    name: 'Test Bridal Shop',
    description: 'The best wedding dresses for your special day',
    bio: 'Family-owned business with 20 years of experience'
  };
  
  // Test product data
  const testProduct = {
    title: 'Elegant Wedding Dress',
    description: 'A beautiful white wedding dress with lace details',
    price: '999.99',
    category: 'DRESSES',
    condition: 'NEW',
    tags: 'wedding,dress,elegant,white'
  };

  describe('Seller Registration', () => {
    beforeEach(() => {
      // Login as regular user before each test
      cy.login(testUser.email, testUser.password);
    });

    it('should navigate to seller registration page', () => {
      cy.visit('/');
      
      // Look for become seller link in the navigation or user menu
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="become-seller-link"]').length > 0) {
          cy.get('[data-testid="become-seller-link"]').click();
        } else {
          // Try to find it in the user dropdown menu
          cy.get('[data-testid="user-menu"]').click();
          cy.contains('Become a Seller').click();
        }
      });
      
      cy.url().should('include', '/seller/register');
      cy.contains('Become a Seller').should('be.visible');
    });

    it('should validate seller registration form', () => {
      cy.visit('/seller/register');
      
      // Submit empty form
      cy.get('button[type="submit"]').click();
      
      // Check validation errors
      cy.contains('Shop name is required').should('be.visible');
      cy.contains('Shop description is required').should('be.visible');
    });

    it('should successfully submit seller registration', () => {
      cy.visit('/seller/register');
      
      // Fill form
      cy.get('input[name="shopName"]').type(testShop.name);
      cy.get('textarea[name="shopDescription"]').type(testShop.description);
      cy.get('textarea[name="sellerBio"]').type(testShop.bio);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to pending page
      cy.url().should('include', '/seller/pending');
      cy.contains('Your seller application is pending approval').should('be.visible');
    });
  });

  describe('Seller Dashboard', () => {
    beforeEach(() => {
      // Login as seller before each test
      cy.login(testSeller.email, testSeller.password);
    });

    it('should access seller dashboard', () => {
      cy.visit('/');
      
      // Look for seller dashboard link in the navigation or user menu
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="seller-dashboard-link"]').length > 0) {
          cy.get('[data-testid="seller-dashboard-link"]').click();
        } else {
          // Try to find it in the user dropdown menu
          cy.get('[data-testid="user-menu"]').click();
          cy.contains('Seller Dashboard').click();
        }
      });
      
      cy.url().should('include', '/seller/dashboard');
      cy.contains('Seller Dashboard').should('be.visible');
    });

    it('should display seller statistics', () => {
      cy.visit('/seller/dashboard');
      
      // Check dashboard elements
      cy.get('[data-testid="total-sales"]').should('exist');
      cy.get('[data-testid="total-products"]').should('exist');
      cy.get('[data-testid="average-rating"]').should('exist');
      
      // Check for sales chart or graph
      cy.get('[data-testid="sales-chart"]').should('exist');
    });

    it('should navigate to product management', () => {
      cy.visit('/seller/dashboard');
      
      // Find and click on manage products link
      cy.contains('Manage Products').click();
      
      // Verify redirect to products page
      cy.url().should('include', '/seller/products');
      cy.contains('Your Products').should('be.visible');
    });
  });

  describe('Product Management', () => {
    beforeEach(() => {
      // Login as seller before each test
      cy.login(testSeller.email, testSeller.password);
    });

    it('should navigate to create product page', () => {
      cy.visit('/seller/products');
      
      // Click on create product button
      cy.get('[data-testid="create-product-button"]').click();
      
      // Verify redirect to create product page
      cy.url().should('include', '/seller/products/create');
      cy.contains('Create New Product').should('be.visible');
    });

    it('should validate product creation form', () => {
      cy.visit('/seller/products/create');
      
      // Submit empty form
      cy.get('button[type="submit"]').click();
      
      // Check validation errors
      cy.contains('Title is required').should('be.visible');
      cy.contains('Description is required').should('be.visible');
      cy.contains('Price is required').should('be.visible');
    });

    it('should successfully create a product', () => {
      cy.visit('/seller/products/create');
      
      // Generate unique title to avoid duplicates
      const uniqueTitle = `${testProduct.title} ${Date.now()}`;
      
      // Fill form
      cy.get('input[name="title"]').type(uniqueTitle);
      cy.get('textarea[name="description"]').type(testProduct.description);
      cy.get('input[name="price"]').type(testProduct.price);
      cy.get('select[name="category"]').select(testProduct.category);
      cy.get('select[name="condition"]').select(testProduct.condition);
      cy.get('input[name="tags"]').type(testProduct.tags);
      
      // Handle file upload - this is a mock since we can't actually upload files in tests
      // We'll use a workaround to simulate file upload
      cy.get('input[type="file"]').then(input => {
        // Create a mock file
        const testFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(testFile);
        input[0].files = dataTransfer.files;
        cy.wrap(input).trigger('change', { force: true });
      });
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to products page with success message
      cy.url().should('include', '/seller/products');
      cy.contains('Product created successfully').should('be.visible');
    });

    it('should edit an existing product', () => {
      cy.visit('/seller/products');
      
      // Click edit on first product
      cy.get('[data-testid="edit-product-button"]').first().click();
      
      // Generate unique title for update
      const updatedTitle = `Updated Product ${Date.now()}`;
      
      // Update title
      cy.get('input[name="title"]').clear().type(updatedTitle);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to products page with success message
      cy.url().should('include', '/seller/products');
      cy.contains('Product updated successfully').should('be.visible');
      
      // Verify the product was updated
      cy.contains(updatedTitle).should('be.visible');
    });

    it('should delete a product', () => {
      cy.visit('/seller/products');
      
      // Get product count before deletion
      cy.get('[data-testid="product-item"]').then($items => {
        const countBefore = $items.length;
        
        // Click delete on first product
        cy.get('[data-testid="delete-product-button"]').first().click();
        
        // Confirm deletion in modal
        cy.get('[data-testid="confirm-delete-button"]').click();
        
        // Verify product was deleted
        cy.contains('Product deleted successfully').should('be.visible');
        
        // Verify product count decreased
        cy.get('[data-testid="product-item"]').should('have.length', countBefore - 1);
      });
    });
  });

  describe('Shop Profile Management', () => {
    beforeEach(() => {
      // Login as seller before each test
      cy.login(testSeller.email, testSeller.password);
    });

    it('should navigate to shop settings', () => {
      cy.visit('/seller/dashboard');
      
      // Find and click on shop settings link
      cy.contains('Shop Settings').click();
      
      // Verify redirect to shop settings page
      cy.url().should('include', '/seller/settings');
      cy.contains('Shop Profile').should('be.visible');
    });

    it('should update shop profile', () => {
      cy.visit('/seller/settings');
      
      // Generate unique shop name
      const updatedShopName = `Updated Shop ${Date.now()}`;
      
      // Update shop name
      cy.get('input[name="shopName"]').clear().type(updatedShopName);
      
      // Update shop description
      cy.get('textarea[name="shopDescription"]').clear().type('Updated shop description with new details');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Verify update was successful
      cy.contains('Shop profile updated successfully').should('be.visible');
      
      // Verify the shop name was updated
      cy.get('input[name="shopName"]').should('have.value', updatedShopName);
    });

    it('should update shop banner image', () => {
      cy.visit('/seller/settings');
      
      // Handle file upload for banner - this is a mock
      cy.get('input[type="file"][name="bannerImage"]').then(input => {
        // Create a mock file
        const testFile = new File(['dummy content'], 'test-banner.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(testFile);
        input[0].files = dataTransfer.files;
        cy.wrap(input).trigger('change', { force: true });
      });
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Verify update was successful
      cy.contains('Shop profile updated successfully').should('be.visible');
    });

    it('should view public shop page', () => {
      cy.visit('/seller/dashboard');
      
      // Find and click on view shop link
      cy.contains('View Shop').click();
      
      // Should navigate to public shop page
      cy.url().should('include', '/shop/');
      
      // Verify shop page elements
      cy.get('[data-testid="shop-name"]').should('be.visible');
      cy.get('[data-testid="shop-description"]').should('be.visible');
      cy.get('[data-testid="shop-products"]').should('be.visible');
    });
  });
});
