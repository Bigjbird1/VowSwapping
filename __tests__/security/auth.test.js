import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInForm from '@/components/auth/SignInForm';
import { signIn } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' }))
}));

describe('Authentication Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate email format', async () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('should enforce password requirements', async () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('should prevent empty submissions', async () => {
    render(<SignInForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('should call signIn with correct credentials for valid input', async () => {
    signIn.mockResolvedValueOnce({ ok: true, error: null });
    
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({
          email: 'test@example.com',
          password: 'Password123!',
          redirect: false,
        })
      );
    });
  });

  it('should display error message on authentication failure', async () => {
    signIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' });
    
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors during sign in', async () => {
    signIn.mockRejectedValueOnce(new Error('Network error'));
    
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error signing in/i)).toBeInTheDocument();
    });
  });
});
