// Authentication flow tests

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should allow a user to sign up', () => {
    // Generate a unique email for testing
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    cy.visit('/auth/signup');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to verification page
    cy.url().should('include', '/auth/verify-email');
    cy.contains('Verification email sent').should('be.visible');
  });

  it('should show validation errors on signup form', () => {
    cy.visit('/auth/signup');
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Check validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
    
    // Test password mismatch
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('DifferentPassword123!');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should allow a user to sign in', () => {
    // Use test user credentials from Cypress environment variables
    const { email, password } = Cypress.env('testUser');
    
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Verify successful login
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Check that user menu is visible
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('should show error message for invalid credentials', () => {
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('WrongPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Check for error message
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should allow a user to request password reset', () => {
    cy.visit('/auth/forgot-password');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    
    // Verify success message
    cy.contains('Reset link sent').should('be.visible');
  });

  it('should validate email on password reset form', () => {
    cy.visit('/auth/forgot-password');
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    
    // Check validation error
    cy.contains('Invalid email address').should('be.visible');
  });

  it('should navigate between auth pages', () => {
    // Sign in to sign up
    cy.visit('/auth/signin');
    cy.contains('Sign up').click();
    cy.url().should('include', '/auth/signup');
    
    // Sign up to sign in
    cy.contains('Sign in').click();
    cy.url().should('include', '/auth/signin');
    
    // Sign in to forgot password
    cy.contains('Forgot password?').click();
    cy.url().should('include', '/auth/forgot-password');
    
    // Forgot password to sign in
    cy.contains('Back to sign in').click();
    cy.url().should('include', '/auth/signin');
  });
});
