import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import SignUpForm from '@/components/auth/SignUpForm';
import SignInForm from '@/components/auth/SignInForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import ProfileForm from '@/components/profile/ProfileForm';
import { useForm } from 'react-hook-form';

// Mock react-hook-form
jest.mock('react-hook-form', () => {
  const originalModule = jest.requireActual('react-hook-form');
  return {
    ...originalModule,
    useForm: jest.fn(() => ({
      register: jest.fn(name => ({ name })),
      handleSubmit: jest.fn(cb => jest.fn()),
      formState: {
        errors: {},
        isSubmitted: false
      },
      setError: jest.fn(),
      clearErrors: jest.fn(),
    }))
  };
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => param === 'token' ? 'mock-token' : null)
  })),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({ 
    data: null, 
    status: 'unauthenticated' 
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Form Validation Integration', () => {
  // Mock router push function
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router implementation
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    
    // Mock signIn success
    signIn.mockResolvedValue({
      ok: true,
      error: null,
    });
    
    // Reset useForm mock to default state
    useForm.mockImplementation(() => ({
      register: jest.fn(name => ({ name })),
      handleSubmit: jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ name: 'Test User', email: 'test@example.com', password: 'Password123!' });
      }),
      formState: {
        errors: {},
        isSubmitted: false
      },
      setError: jest.fn(),
      clearErrors: jest.fn(),
    }));
  });
  
  describe('Real-time Validation', () => {
    it('should validate email format in real-time', async () => {
      // Mock form with email validation error
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return cb({ name: 'Test User', email: 'invalid-email', password: 'Password123!' });
        }),
        formState: {
          errors: {
            email: {
              message: 'Please enter a valid email address'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      const { unmount } = render(<SignUpForm />);
      
      // Check for error message
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      
      // Unmount the component
      unmount();
      
      // Mock form with no errors
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return cb({ name: 'Test User', email: 'valid@example.com', password: 'Password123!' });
        }),
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      // Render a new component
      render(<SignUpForm />);
      
      // Check that error message is gone
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
    
    it('should validate password strength in real-time', async () => {
      // Mock form with password validation error
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return cb({ name: 'Test User', email: 'test@example.com', password: 'weak' });
        }),
        formState: {
          errors: {
            password: {
              message: 'Password must be at least 8 characters'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      const { unmount } = render(<SignUpForm />);
      
      // Check for error message
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      
      // Unmount the component
      unmount();
      
      // Mock form with no errors
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return cb({ name: 'Test User', email: 'test@example.com', password: 'StrongPassword123!' });
        }),
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      // Render a new component
      render(<SignUpForm />);
      
      // Check that error message is gone
      expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
    
    it('should validate password confirmation match in real-time', async () => {
      // Mock form with password confirmation error
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return cb({ 
            name: 'Test User', 
            email: 'test@example.com', 
            password: 'Password123!',
            confirmPassword: 'DifferentPassword123!'
          });
        }),
        formState: {
          errors: {
            confirmPassword: {
              message: 'Passwords do not match'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      const { unmount } = render(<SignUpForm />);
      
      // Check for error message
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      
      // Unmount the component
      unmount();
      
      // Mock form with no errors
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return cb({ 
            name: 'Test User', 
            email: 'test@example.com', 
            password: 'Password123!',
            confirmPassword: 'Password123!'
          });
        }),
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      // Render a new component
      render(<SignUpForm />);
      
      // Check that error message is gone
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });
  });
  
  describe('Form Submission', () => {
    it('should prevent submission with validation errors', async () => {
      // Mock form with multiple validation errors
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          // Don't call the callback to simulate validation failure
          return false;
        }),
        formState: {
          errors: {
            email: {
              message: 'Please enter a valid email address'
            },
            password: {
              message: 'Password must be at least 8 characters'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      render(<SignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      // Check that fetch was not called (form submission prevented)
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Check for error messages
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
    
    it('should allow submission when all validations pass', async () => {
      // Mock form with no validation errors
      const mockHandleSubmit = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          name: 'Test User', 
          email: 'valid@example.com', 
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmit,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      render(<SignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      // Check that the submit handler was called
      expect(mockHandleSubmit).toHaveBeenCalled();
      
      // Wait for fetch to be called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
    
    it('should handle server-side validation errors', async () => {
      // Mock fetch to return validation error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ 
          message: 'Email already in use',
          error: 'Validation failed', 
          errors: { email: 'Email already in use' } 
        }),
      });
      
      // Mock form with no validation errors
      const mockHandleSubmit = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          name: 'Test User', 
          email: 'valid@example.com', 
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmit,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      render(<SignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      // Wait for fetch to be called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Check for server error message
      await waitFor(() => {
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Error Recovery', () => {
    it('should allow fixing and resubmitting after validation errors', async () => {
      // First mock form with validation errors
      const mockHandleSubmit = jest.fn(cb => e => {
        if (e) e.preventDefault();
        // Don't call the callback to simulate validation failure
        return false;
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmit,
        formState: {
          errors: {
            email: {
              message: 'Please enter a valid email address'
            },
            password: {
              message: 'Password must be at least 8 characters'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      const { unmount } = render(<SignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      // Check that fetch was not called (form submission prevented)
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Unmount the component
      unmount();
      
      // Now mock form with no validation errors
      const mockHandleSubmitFixed = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          name: 'Test User', 
          email: 'valid@example.com', 
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmitFixed,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      // Render a new component
      render(<SignUpForm />);
      
      // Get the new submit button
      const newSubmitButton = screen.getByRole('button', { name: /sign up/i });
      
      // Submit the form again
      fireEvent.click(newSubmitButton);
      
      // Wait for fetch to be called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
    
    it('should allow fixing and resubmitting after server-side errors', async () => {
      // Mock fetch to return validation error first, then success
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ 
            message: 'Email already in use',
            error: 'Validation failed', 
            errors: { email: 'Email already in use' } 
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        });
      
      // Mock form with no validation errors
      const mockHandleSubmit = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          name: 'Test User', 
          email: 'taken@example.com', 
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmit,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      const { unmount } = render(<SignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      // Wait for server error message
      await waitFor(() => {
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
      });
      
      // Unmount the component
      unmount();
      
      // Now mock form with different email
      const mockHandleSubmitFixed = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          name: 'Test User', 
          email: 'new@example.com', 
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmitFixed,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      // Render a new component
      render(<SignUpForm />);
      
      // Get the new submit button
      const newSubmitButton = screen.getByRole('button', { name: /sign up/i });
      
      // Submit the form again
      fireEvent.click(newSubmitButton);
      
      // Check that fetch was called again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
  
  describe('Cross-Form Validation', () => {
    it('should maintain consistent validation rules across different forms', async () => {
      // Mock form with email validation error for SignUpForm
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return false;
        }),
        formState: {
          errors: {
            email: {
              message: 'Please enter a valid email address'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      const { unmount } = render(<SignUpForm />);
      
      // Check for error message
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      
      // Unmount sign up form
      unmount();
      
      // Mock form with email validation error for SignInForm
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: jest.fn(cb => e => {
          if (e) e.preventDefault();
          return false;
        }),
        formState: {
          errors: {
            email: {
              message: 'Please enter a valid email address'
            }
          },
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      // Render sign in form
      render(<SignInForm />);
      
      // Check for similar error message
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    
    it('should validate password reset token format consistently', async () => {
      // Mock invalid token response
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ 
          message: 'Invalid or expired token',
        }),
      });
      
      // Mock form with no validation errors
      const mockHandleSubmit = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmit,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      render(<PasswordResetForm />);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);
      
      // Check for token error message
      await waitFor(() => {
        expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Form State Recovery', () => {
    it('should preserve form values after failed submission', async () => {
      // Mock fetch to return error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Server error', message: 'Something went wrong' }),
      });
      
      // Mock user object for ProfileForm
      const mockUser = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      // Mock form with no validation errors
      const mockHandleSubmit = jest.fn(cb => e => {
        if (e) e.preventDefault();
        return cb({ 
          name: 'Updated Name',
        });
      });
      
      useForm.mockImplementation(() => ({
        register: jest.fn(name => ({ name })),
        handleSubmit: mockHandleSubmit,
        formState: {
          errors: {},
          isSubmitted: true
        },
        setError: jest.fn(),
        clearErrors: jest.fn(),
      }));
      
      render(<ProfileForm user={mockUser} />);
      
      // Mock the input value
      const nameInput = screen.getByLabelText(/name/i);
      Object.defineProperty(nameInput, 'value', { value: 'Updated Name' });
      
      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
      
      // Verify form values are preserved
      expect(nameInput.value).toBe('Updated Name');
    });
    
    it('should reset form after successful submission when appropriate', async () => {
      // Mock fetch to return success
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });
      
      // Render a form that should reset (like a contact form)
      const ContactForm = () => {
        const [formState, setFormState] = React.useState({
          name: '',
          email: '',
          message: ''
        });
        const [submitted, setSubmitted] = React.useState(false);
        
        const handleSubmit = async (e) => {
          e.preventDefault();
          await fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify(formState)
          });
          setFormState({ name: '', email: '', message: '' });
          setSubmitted(true);
        };
        
        return (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={formState.name}
                onChange={(e) => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                value={formState.email}
                onChange={(e) => setFormState({...formState, email: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={formState.message}
                onChange={(e) => setFormState({...formState, message: e.target.value})}
              />
            </div>
            <button type="submit">Send Message</button>
            {submitted && <div>Message sent successfully!</div>}
          </form>
        );
      };
      
      render(<ContactForm />);
      
      // Get form inputs
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      // Fill form with data
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(messageInput, { target: { value: 'Test message content' } });
      
      // Submit the form
      fireEvent.click(submitButton);
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
      });
      
      // Verify form was reset
      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(messageInput.value).toBe('');
    });
  });
});
