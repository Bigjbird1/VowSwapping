describe('Checkout Process', () => {
  // Test user with existing address
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  beforeEach(() => {
    // Login before each test
    cy.login(testUser.email, testUser.password);
    
    // Add a product to cart
    cy.addToCart();
  });

  it('should navigate to checkout from cart', () => {
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/checkout');
  });

  it('should allow selecting an existing address', () => {
    // Create a test address if needed
    cy.createTestAddress().then(() => {
      cy.visit('/checkout');
      
      // Select the first address from dropdown
      cy.get('select[name="addressId"]').select('1'); // Assuming address ID 1 exists
      
      // Verify address details are displayed
      cy.get('[data-testid="address-details"]').should('be.visible');
    });
  });

  it('should allow adding a new address during checkout', () => {
    cy.visit('/checkout');
    
    // Select "Add new address" option
    cy.get('select[name="addressId"]').select('new');
    
    // Fill address form
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="street"]').type('123 Test St');
    cy.get('input[name="city"]').type('Test City');
    cy.get('input[name="state"]').type('Test State');
    cy.get('input[name="postalCode"]').type('12345');
    cy.get('input[name="country"]').type('Test Country');
    
    // Continue to payment
    cy.get('[data-testid="continue-to-payment"]').click();
    
    // Verify we're on the payment step
    cy.url().should('include', '/checkout?step=payment');
  });

  it('should display order summary with correct totals', () => {
    cy.visit('/checkout');
    
    // Verify order summary
    cy.get('[data-testid="order-summary"]').should('be.visible');
    cy.get('[data-testid="subtotal"]').should('exist');
    cy.get('[data-testid="shipping"]').should('exist');
    cy.get('[data-testid="tax"]').should('exist');
    cy.get('[data-testid="total"]').should('exist');
    
    // Verify the total is calculated correctly
    cy.get('[data-testid="subtotal"]').invoke('text').then((subtotalText) => {
      const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
      
      cy.get('[data-testid="shipping"]').invoke('text').then((shippingText) => {
        const shipping = parseFloat(shippingText.replace(/[^0-9.]/g, ''));
        
        cy.get('[data-testid="tax"]').invoke('text').then((taxText) => {
          const tax = parseFloat(taxText.replace(/[^0-9.]/g, ''));
          
          cy.get('[data-testid="total"]').invoke('text').then((totalText) => {
            const displayedTotal = parseFloat(totalText.replace(/[^0-9.]/g, ''));
            const calculatedTotal = (subtotal + shipping + tax).toFixed(2);
            
            // Compare with a small tolerance for floating point errors
            expect(displayedTotal).to.be.closeTo(parseFloat(calculatedTotal), 0.01);
          });
        });
      });
    });
  });

  it('should display Stripe payment form', () => {
    cy.visit('/checkout?step=payment');
    
    // Verify Stripe elements are loaded
    cy.get('[data-testid="stripe-payment-form"]').should('be.visible');
    
    // Check for Stripe iframe
    cy.get('iframe[title="Secure card payment input frame"]').should('be.visible');
  });

  it('should handle successful payment and redirect to success page', () => {
    cy.visit('/checkout?step=payment');
    
    // Use Stripe test card - this requires special handling for iframes
    // We'll need to use Cypress commands to interact with Stripe iframe
    cy.get('iframe[title="Secure card payment input frame"]').then($iframe => {
      const body = $iframe.contents().find('body');
      
      // Fill card details in the iframe
      cy.wrap(body).find('input[name="cardnumber"]').type('4242424242424242');
      cy.wrap(body).find('input[name="exp-date"]').type('1230');
      cy.wrap(body).find('input[name="cvc"]').type('123');
      cy.wrap(body).find('input[name="postal"]').type('12345');
    });
    
    // Submit payment
    cy.get('[data-testid="submit-payment"]').click();
    
    // Should redirect to success page
    cy.url().should('include', '/checkout/success', { timeout: 10000 });
    cy.contains('Thank you for your order').should('be.visible');
  });

  it('should handle payment errors gracefully', () => {
    cy.visit('/checkout?step=payment');
    
    // Use Stripe declined card
    cy.get('iframe[title="Secure card payment input frame"]').then($iframe => {
      const body = $iframe.contents().find('body');
      
      // Fill card details in the iframe with a declined card
      cy.wrap(body).find('input[name="cardnumber"]').type('4000000000000002');
      cy.wrap(body).find('input[name="exp-date"]').type('1230');
      cy.wrap(body).find('input[name="cvc"]').type('123');
      cy.wrap(body).find('input[name="postal"]').type('12345');
    });
    
    // Submit payment
    cy.get('[data-testid="submit-payment"]').click();
    
    // Should show error message
    cy.contains('Your card was declined').should('be.visible');
  });
});
