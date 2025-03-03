import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

// Mock fetch
global.fetch = jest.fn();

// Mock useRouter and useSearchParams
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn((param) => {
      if (param === 'token' && mockToken) {
        return mockToken;
      }
      return null;
    })
  })
}));

// Variable to control token presence in tests
let mockToken = null;

describe('PasswordResetForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );
    mockToken = null; // Reset token for each test
  });

  describe('Request Reset Form', () => {
    it('should render the request reset form when no token is present', () => {
      render(<PasswordResetForm />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it('should validate email format', async () => {
      render(<PasswordResetForm />);
      
      // Submit form without entering email (will trigger HTML5 validation)
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      // Enter invalid email and submit
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      // Submit the form
      fireEvent.submit(screen.getByRole('form'));
      
      // Wait for validation errors to appear
      await waitFor(() => {
        // Check if the form is still in the document (validation failed)
        expect(screen.getByRole('form')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should submit the request reset form with valid email', async () => {
      render(<PasswordResetForm />);
      
      // Enter valid email
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/forgot-password',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'test@example.com',
            }),
          })
        );
      });
    });

    it('should display success message after sending reset email', async () => {
      render(<PasswordResetForm />);
      
      // Enter valid email
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
      });
    });

    it('should display error message on request reset failure', async () => {
      // Mock fetch to return an error
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'User not found' })
        })
      );
      
      render(<PasswordResetForm />);
      
      // Enter valid email
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during request reset', async () => {
      // Mock fetch to throw an error
      global.fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );
      
      render(<PasswordResetForm />);
      
      // Enter valid email
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Password Form', () => {
    beforeEach(() => {
      mockToken = 'valid-reset-token';
    });

    it('should render the reset password form when token is present', () => {
      render(<PasswordResetForm />);
      
      // Use more specific selectors to avoid ambiguity
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      expect(passwordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    it('should validate matching passwords', async () => {
      render(<PasswordResetForm />);
      
      // Enter mismatched passwords with more specific selectors
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
      
      // Submit the form
      fireEvent.submit(screen.getByRole('form'));
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should enforce password complexity requirements', async () => {
      render(<PasswordResetForm />);
      
      // Enter simple password with more specific selectors
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'simple' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'simple' } });
      
      // Submit the form
      fireEvent.submit(screen.getByRole('form'));
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should submit the reset password form with valid data', async () => {
      render(<PasswordResetForm />);
      
      // Enter valid passwords with more specific selectors
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/reset-password',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: 'valid-reset-token',
              password: 'NewPassword123!',
            }),
          })
        );
      });
    });

    it('should display success message after resetting password', async () => {
      render(<PasswordResetForm />);
      
      // Enter valid passwords with more specific selectors
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
      });
    });

    it('should display error message on reset password failure', async () => {
      // Mock fetch to return an error
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid or expired token' })
        })
      );
      
      render(<PasswordResetForm />);
      
      // Enter valid passwords with more specific selectors
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during password reset', async () => {
      // Mock fetch to throw an error
      global.fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );
      
      render(<PasswordResetForm />);
      
      // Enter valid passwords with more specific selectors
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });
});
