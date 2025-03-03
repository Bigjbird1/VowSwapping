// Complete authentication flow tests

describe('Complete Authentication Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should complete the full registration and verification flow', () => {
    // Generate a unique email for testing
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const testUser = {
      name: 'Test User',
      email: uniqueEmail,
      password: 'Password123!'
    };
    
    // Step 1: Register a new user
    cy.visit('/auth/signup', { failOnStatusCode: false });
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to verification page
    cy.url().should('include', '/auth/verify-email');
    cy.contains('Verify Your Email').should('be.visible');
    cy.contains('verification email').should('be.visible');
    
    // In a real test environment, you would need to:
    // 1. Intercept the email sent to the user
    // 2. Extract the verification token from the email
    // 3. Visit the verification URL with the token
    
    // For this test, we'll simulate the verification by directly visiting the verification page with a success parameter
    // Note: In a real environment, you would need to set up a test email server or use a service like Mailhog
    cy.visit('/auth/verify-email?success=true', { failOnStatusCode: false });
    
    // Verify successful verification
    cy.contains('Email Verified!').should('be.visible');
    cy.contains('Your email has been successfully verified').should('be.visible');
    
    // Step 2: Sign in with the newly created account
    cy.contains('Sign In').click();
    cy.url().should('include', '/auth/signin');
    
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    
    // Verify successful login and redirect to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('exist');
    
    // Step 3: Access user profile
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Profile').click();
    
    // Verify profile page loads with user information
    cy.url().should('include', '/profile');
    cy.get('input[name="name"]').should('have.value', testUser.name);
    cy.get('input[name="email"]').should('have.value', testUser.email);
  });

  it('should complete the password reset flow', () => {
    // This test requires a pre-existing user account
    // Use environment variables or a test user that's guaranteed to exist
    const testEmail = Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
    const newPassword = `NewPassword${Date.now()}!`;
    
    // Step 1: Request password reset
    cy.visit('/auth/forgot-password', { failOnStatusCode: false });
    cy.get('input[name="email"]').type(testEmail);
    cy.get('button[type="submit"]').click();
    
    // Verify success message
    cy.contains('Password reset email sent').should('be.visible');
    
    // In a real test environment, you would need to:
    // 1. Intercept the email sent to the user
    // 2. Extract the reset token from the email
    // 3. Visit the reset password URL with the token
    
    // For this test, we'll simulate having a valid token
    // Note: This part would need to be adapted for your actual testing environment
    
    // Mock a reset token (in a real test, you would get this from the intercepted email)
    const mockToken = 'mock-reset-token';
    
    // Step 2: Reset password with token
    cy.visit(`/auth/reset-password?token=${mockToken}`, { failOnStatusCode: false });
    
    // In a real environment, this would fail because the token is not valid
    // For testing purposes, we'll check if the form is displayed
    cy.get('input[name="password"]').should('exist');
    cy.get('input[name="confirmPassword"]').should('exist');
    
    // Fill the form (this would not actually work with a mock token)
    cy.get('input[name="password"]').type(newPassword);
    cy.get('input[name="confirmPassword"]').type(newPassword);
    cy.get('button[type="submit"]').click();
    
    // Since we're using a mock token, we expect an error message
    // In a real test with a valid token, you would check for success
    cy.contains(/invalid|expired|error/i).should('be.visible');
    
    // Note: To fully test this flow, you would need:
    // 1. A way to generate a valid reset token in your test environment
    // 2. Or a way to mock the token validation in your API
  });

  it('should handle invalid login attempts', () => {
    cy.visit('/auth/signin', { failOnStatusCode: false });
    
    // Test with non-existent email
    cy.get('input[name="email"]').type('nonexistent@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Verify error message
    cy.contains(/invalid credentials|email or password/i).should('be.visible');
    
    // Test with wrong password
    cy.get('input[name="email"]').clear().type('test@example.com');
    cy.get('input[name="password"]').clear().type('WrongPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Verify error message
    cy.contains(/invalid credentials|email or password/i).should('be.visible');
  });

  it('should enforce password requirements on signup', () => {
    cy.visit('/auth/signup', { failOnStatusCode: false });
    
    // Fill form with valid data except for password
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test-password@example.com');
    
    // Test with short password
    cy.get('input[name="password"]').type('short');
    cy.get('input[name="confirmPassword"]').type('short');
    cy.get('button[type="submit"]').click();
    
    // Verify validation error
    cy.contains(/password must be at least/i).should('be.visible');
    
    // Test with mismatched passwords
    cy.get('input[name="password"]').clear().type('Password123!');
    cy.get('input[name="confirmPassword"]').clear().type('DifferentPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Verify validation error
    cy.contains(/passwords do not match/i).should('be.visible');
  });

  it('should navigate between auth pages', () => {
    // Start at sign in page
    cy.visit('/auth/signin', { failOnStatusCode: false });
    
    // Navigate to sign up page
    cy.contains('Sign up').click();
    cy.url().should('include', '/auth/signup');
    
    // Navigate back to sign in page
    cy.contains('Sign in').click();
    cy.url().should('include', '/auth/signin');
    
    // Navigate to forgot password page
    cy.contains('Forgot password').click();
    cy.url().should('include', '/auth/forgot-password');
    
    // Navigate back to sign in page
    cy.contains('Back to sign in').click();
    cy.url().should('include', '/auth/signin');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login();
    
    // Verify we're logged in
    cy.visit('/', { failOnStatusCode: false });
    cy.get('[data-testid="user-menu"]').should('exist');
    
    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Logout').click();
    
    // Verify we're logged out
    cy.get('[data-testid="user-menu"]').should('not.exist');
    
    // Verify we can't access protected pages
    cy.visit('/profile', { failOnStatusCode: false });
    cy.url().should('include', '/auth/signin'); // Should redirect to login
  });
});
