import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileForm from '@/components/profile/ProfileForm';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ProfileForm Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };
  
  const mockRouter = {
    refresh: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    
    // Reset fetch mock
    global.fetch.mockReset();
  });
  
  it('renders the profile form with user data', () => {
    render(<ProfileForm user={mockUser} />);
    
    // Check if form elements are rendered with correct values
    expect(screen.getByLabelText(/name/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
  
  it('handles successful form submission', async () => {
    // Mock successful API response
    global.fetch.mockImplementation(() => 
      new Promise((resolve) => {
        // Delay the response to ensure loading state is visible
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              message: 'Profile updated successfully',
              user: { ...mockUser, name: 'Updated Name' },
            }),
          });
        }, 100);
      })
    );
    
    render(<ProfileForm user={mockUser} />);
    
    // Change name field
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    // Wait for loading state to be applied
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
    
    // Check loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
    
    // Check if loading state is reset
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
    });
    
    // Check if router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  it('handles validation errors', async () => {
    render(<ProfileForm user={mockUser} />);
    
    // Change name field to invalid value (too short)
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
    
    // Verify API was not called
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Check that button is not in loading state
    expect(submitButton).not.toBeDisabled();
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
  });
  
  it('handles API error response', async () => {
    // Mock error API response with delay
    global.fetch.mockImplementation(() => 
      new Promise((resolve) => {
        // Delay the response to ensure loading state is visible
        setTimeout(() => {
          resolve({
            ok: false,
            json: async () => ({
              message: 'Something went wrong',
            }),
          });
        }, 100);
      })
    );
    
    render(<ProfileForm user={mockUser} />);
    
    // Change name field
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    // Wait for loading state to be applied
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
    
    // Check loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
    
    // Check if loading state is reset
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
    });
  });
  
  it('handles network errors', async () => {
    // Mock network error with delay
    global.fetch.mockImplementation(() => 
      new Promise((_, reject) => {
        // Delay the response to ensure loading state is visible
        setTimeout(() => {
          reject(new Error('Network error'));
        }, 100);
      })
    );
    
    render(<ProfileForm user={mockUser} />);
    
    // Change name field
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);
    
    // Wait for loading state to be applied
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
    
    // Check loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
    
    // Check if loading state is reset
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
    });
  });
});
