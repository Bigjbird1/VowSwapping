import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddressManager from '@/components/profile/AddressManager';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
window.confirm = jest.fn();

describe('AddressManager Component', () => {
  const mockAddresses = [
    {
      id: 'address-1',
      name: 'Home',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'USA',
      isDefault: true
    },
    {
      id: 'address-2',
      name: 'Work',
      street: '456 Office Blvd',
      city: 'Worktown',
      state: 'NY',
      postalCode: '67890',
      country: 'USA',
      isDefault: false
    }
  ];
  
  const mockRouter = {
    refresh: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    
    // Reset fetch mock
    global.fetch.mockReset();
    
    // Default confirm to true
    window.confirm.mockReturnValue(true);
  });
  
  it('renders the address form and saved addresses', () => {
    render(<AddressManager addresses={mockAddresses} />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/address name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/set as default address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument();
    
    // Check if saved addresses are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText(/456 Office Blvd/)).toBeInTheDocument();
    
    // Check if default badge is shown
    expect(screen.getByText('Default')).toBeInTheDocument();
    
    // Check if action buttons are rendered
    expect(screen.getAllByTestId('edit-address-button').length).toBe(2);
    expect(screen.getAllByTestId('delete-address-button').length).toBe(2);
    expect(screen.getByTestId('set-default-button')).toBeInTheDocument();
  });
  
  it('handles adding a new address', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Address created successfully',
        address: {
          id: 'new-address',
          name: 'New Address',
          street: '789 New St',
          city: 'Newtown',
          state: 'NJ',
          postalCode: '54321',
          country: 'USA',
          isDefault: false
        }
      }),
    });
    
    render(<AddressManager addresses={mockAddresses} />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/address name/i), { target: { value: 'New Address' } });
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '789 New St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Newtown' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'NJ' } });
    fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '54321' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'USA' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /add address/i });
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/adding/i)).toBeInTheDocument();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Address',
          street: '789 New St',
          city: 'Newtown',
          state: 'NJ',
          postalCode: '54321',
          country: 'USA',
          isDefault: false
        }),
      });
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/address created successfully/i)).toBeInTheDocument();
    });
    
    // Check if router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  it('handles editing an existing address', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Address updated successfully',
        address: {
          ...mockAddresses[1],
          name: 'Updated Work',
          street: '789 Office Ave'
        }
      }),
    });
    
    render(<AddressManager addresses={mockAddresses} />);
    
    // Click edit button for the second address
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[1]);
    
    // Check if form is populated with address data
    expect(screen.getByLabelText(/address name/i)).toHaveValue('Work');
    expect(screen.getByLabelText(/street address/i)).toHaveValue('456 Office Blvd');
    
    // Update form fields
    fireEvent.change(screen.getByLabelText(/address name/i), { target: { value: 'Updated Work' } });
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '789 Office Ave' } });
    
    // Submit form
    const updateButton = screen.getByRole('button', { name: /update address/i });
    fireEvent.click(updateButton);
    
    // Check loading state
    expect(updateButton).toBeDisabled();
    expect(screen.getByText(/updating/i)).toBeInTheDocument();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/addresses/address-2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      });
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/address updated successfully/i)).toBeInTheDocument();
    });
    
    // Check if router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  it('handles deleting an address', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Address deleted successfully'
      }),
    });
    
    render(<AddressManager addresses={mockAddresses} />);
    
    // Click delete button for the second address
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]);
    
    // Check if confirmation was requested
    expect(window.confirm).toHaveBeenCalled();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/addresses/address-2', {
        method: 'DELETE',
      });
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/address deleted successfully/i)).toBeInTheDocument();
    });
    
    // Check if router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  it('cancels delete when user declines confirmation', async () => {
    // Mock user declining confirmation
    window.confirm.mockReturnValueOnce(false);
    
    render(<AddressManager addresses={mockAddresses} />);
    
    // Click delete button for the second address
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]);
    
    // Check if confirmation was requested
    expect(window.confirm).toHaveBeenCalled();
    
    // Verify API was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  it('handles setting an address as default', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Address updated successfully',
        address: {
          ...mockAddresses[1],
          isDefault: true
        }
      }),
    });
    
    render(<AddressManager addresses={mockAddresses} />);
    
    // Click "Set as Default" button for the second address
    const setDefaultButton = screen.getByText('Set as Default');
    fireEvent.click(setDefaultButton);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/addresses/address-2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"isDefault":true'),
      });
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/address set as default successfully/i)).toBeInTheDocument();
    });
    
    // Check if router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  it('handles validation errors', async () => {
    render(<AddressManager addresses={mockAddresses} />);
    
    // Submit form with empty fields
    const submitButton = screen.getByRole('button', { name: /add address/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/street address must be at least 5 characters/i)).toBeInTheDocument();
    });
    
    // Verify API was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  it('handles API error response', async () => {
    // Mock error API response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'Something went wrong',
      }),
    });
    
    render(<AddressManager addresses={mockAddresses} />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/address name/i), { target: { value: 'New Address' } });
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '789 New St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Newtown' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'NJ' } });
    fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '54321' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'USA' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /add address/i });
    fireEvent.click(submitButton);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
  
  it('displays empty state when no addresses exist', () => {
    render(<AddressManager addresses={[]} />);
    
    expect(screen.getByText(/you don't have any saved addresses yet/i)).toBeInTheDocument();
  });
  
  it('handles canceling edit mode', () => {
    render(<AddressManager addresses={mockAddresses} />);
    
    // Click edit button for the first address
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Check if form is in edit mode
    expect(screen.getByRole('button', { name: /update address/i })).toBeInTheDocument();
    expect(screen.getByTestId('cancel-edit-button')).toBeInTheDocument();
    
    // Click cancel button
    const cancelButton = screen.getByTestId('cancel-edit-button');
    fireEvent.click(cancelButton);
    
    // Check if form is back in add mode
    expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument();
    expect(screen.queryByTestId('cancel-edit-button')).not.toBeInTheDocument();
  });
});
