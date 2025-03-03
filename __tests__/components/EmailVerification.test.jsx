import { render, screen, waitFor } from '@testing-library/react';
import EmailVerification from '@/components/auth/EmailVerification';

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
      if (param === 'success' && mockSuccess) {
        return mockSuccess;
      }
      if (param === 'error' && mockError) {
        return mockError;
      }
      return null;
    })
  })
}));

// Variables to control params in tests
let mockToken = null;
let mockSuccess = null;
let mockError = null;

describe('EmailVerification Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );
    mockToken = null;
    mockSuccess = null;
    mockError = null;
  });

  it('should show loading state initially when token is present', () => {
    mockToken = 'valid-token';
    
    render(<EmailVerification />);
    
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait while we verify your email/i)).toBeInTheDocument();
  });

  it('should display error when no token is provided', async () => {
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid or missing verification token/i)).toBeInTheDocument();
    });
  });

  it('should verify email with valid token', async () => {
    mockToken = 'valid-token';
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify-email',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: 'valid-token',
          }),
        })
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      expect(screen.getByText(/your email has been successfully verified/i)).toBeInTheDocument();
    });
  });

  it('should display error on verification failure', async () => {
    mockToken = 'invalid-token';
    
    // Mock fetch to return an error
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid verification token' })
      })
    );
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid verification token/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors during verification', async () => {
    mockToken = 'valid-token';
    
    // Mock fetch to throw an error
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('should display success message when success param is true', async () => {
    mockSuccess = 'true';
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      expect(screen.getByText(/your email has been successfully verified/i)).toBeInTheDocument();
    });
    
    // Fetch should not be called when success param is present
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should display specific error message based on error param', async () => {
    mockError = 'missing_token';
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(/verification token is missing/i)).toBeInTheDocument();
    });
    
    // Fetch should not be called when error param is present
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should display different error messages for different error types', async () => {
    // Test invalid_token error
    mockError = 'invalid_token';
    
    const { unmount } = render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid verification token/i)).toBeInTheDocument();
    });
    
    unmount();
    
    // Test database_error
    mockError = 'database_error';
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      expect(screen.getByText(/a database error occurred during verification/i)).toBeInTheDocument();
    });
  });

  it('should provide a link to sign in after verification', async () => {
    mockSuccess = 'true';
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink.getAttribute('href')).toBe('/auth/signin');
    });
  });

  it('should provide a link to sign in after verification failure', async () => {
    mockError = 'invalid_token';
    
    render(<EmailVerification />);
    
    await waitFor(() => {
      const signInLink = screen.getByRole('link', { name: /go to sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink.getAttribute('href')).toBe('/auth/signin');
    });
  });
});
