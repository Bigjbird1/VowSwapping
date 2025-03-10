import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductFilters from '@/components/product/ProductFilters';
import { useRouter, usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock fetch for sellers API
global.fetch = jest.fn();

describe('ProductFilters Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  const mockPathname = '/products';
  
  const mockSellers = [
    { id: 'seller-1', name: 'Seller 1', shopName: 'Shop 1' },
    { id: 'seller-2', name: 'Seller 2', shopName: 'Shop 2' },
    { id: 'seller-3', name: 'Seller 3', shopName: null },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    usePathname.mockReturnValue(mockPathname);
    
    // Mock successful fetch response for sellers
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ sellers: mockSellers }),
    });
  });
  
  it('renders all filter sections', async () => {
    render(<ProductFilters />);
    
    // Check if all filter sections are rendered
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Sellers')).toBeInTheDocument();
    
    // Check if action buttons are rendered
    expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    
    // Wait for sellers to load
    await waitFor(() => {
      expect(screen.getByText('Shop 1')).toBeInTheDocument();
      expect(screen.getByText('Shop 2')).toBeInTheDocument();
      expect(screen.getByText('Seller 3')).toBeInTheDocument(); // Uses name when shopName is null
    });
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/sellers');
  });
  
  it('renders with pre-selected filters', async () => {
    render(
      <ProductFilters
        selectedCategory="dresses"
        selectedMinPrice={100}
        selectedMaxPrice={500}
        selectedCondition="like-new"
        searchQuery="wedding"
        selectedSellerId="seller-1"
      />
    );
    
    // Check if search input has the correct value
    expect(screen.getByPlaceholderText('Search products...')).toHaveValue('wedding');
    
    // Check if category radio is selected
    const dressesRadio = screen.getByLabelText('Dresses');
    expect(dressesRadio).toBeChecked();
    
    // Check if price range radio is selected
    const priceRangeRadio = screen.getByTestId('price-range-1'); // $100 - $500
    expect(priceRangeRadio).toBeChecked();
    
    // Check if condition radio is selected
    const likeNewRadio = screen.getByTestId('condition-like-new');
    expect(likeNewRadio).toBeChecked();
    
    // Wait for sellers to load and check if seller radio is selected
    await waitFor(() => {
      const sellerRadios = screen.getAllByRole('radio', { name: 'Shop 1' });
      expect(sellerRadios[0]).toBeChecked();
    });
  });
  
  it('applies filters when Apply Filters button is clicked', async () => {
    render(<ProductFilters />);
    
    // Set search query
    fireEvent.change(screen.getByPlaceholderText('Search products...'), {
      target: { value: 'wedding dress' },
    });
    
    // Select category
    fireEvent.click(screen.getByLabelText('Dresses'));
    
    // Select price range
    fireEvent.click(screen.getByTestId('price-range-1')); // $100 - $500
    
    // Select condition
    fireEvent.click(screen.getByTestId('condition-like-new'));
    
    // Wait for sellers to load and select a seller
    await waitFor(() => {
      expect(screen.getByText('Shop 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Shop 1'));
    
    // Click Apply Filters button
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));
    
    // Verify router.push was called with correct URL
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('/products?category=dresses&minPrice=100&maxPrice=500&condition=like-new&q=wedding+dress&sellerId=seller-1')
    );
  });
  
  it('resets filters when Reset button is clicked', async () => {
    render(
      <ProductFilters
        selectedCategory="dresses"
        selectedMinPrice={100}
        selectedMaxPrice={500}
        selectedCondition="like-new"
        searchQuery="wedding"
        selectedSellerId="seller-1"
      />
    );
    
    // Click Reset button
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    
    // Verify router.push was called with pathname only (no query params)
    expect(mockRouter.push).toHaveBeenCalledWith(mockPathname);
    
    // Check if search input is cleared
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search products...')).toHaveValue('');
    });
    
    // Check if category radio is unchecked
    const dressesRadio = screen.getByLabelText('Dresses');
    expect(dressesRadio).not.toBeChecked();
    
    // Check if price range radio is unchecked
    const priceRangeRadio = screen.getByTestId('price-range-1'); // $100 - $500
    expect(priceRangeRadio).not.toBeChecked();
    
    // Check if condition radio is unchecked
    const likeNewRadio = screen.getByTestId('condition-like-new');
    expect(likeNewRadio).not.toBeChecked();
  });
  
  it('handles sellers loading state', async () => {
    // Mock loading state before resolving
    global.fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({ sellers: mockSellers }),
        });
      }, 100);
    }));
    
    render(<ProductFilters />);
    
    // Check if loading message is displayed
    expect(screen.getByText('Loading sellers...')).toBeInTheDocument();
    
    // Wait for sellers to load
    await waitFor(() => {
      expect(screen.getByText('Shop 1')).toBeInTheDocument();
    });
    
    // Check if loading message is gone
    expect(screen.queryByText('Loading sellers...')).not.toBeInTheDocument();
  });
  
  it('handles empty sellers list', async () => {
    // Mock empty sellers response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sellers: [] }),
    });
    
    render(<ProductFilters />);
    
    // Wait for sellers to load
    await waitFor(() => {
      expect(screen.getByText('No sellers available')).toBeInTheDocument();
    });
  });
  
  it('handles fetch error for sellers', async () => {
    // Mock fetch error
    global.fetch.mockRejectedValueOnce(new Error('Failed to fetch sellers'));
    
    render(<ProductFilters />);
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText('No sellers available')).toBeInTheDocument();
    });
    
    // Check console.error was called
    expect(console.error).toHaveBeenCalled;
  });
  
  it('allows selecting different filter combinations', async () => {
    render(<ProductFilters />);
    
    // Select category
    fireEvent.click(screen.getByLabelText('Accessories'));
    
    // Select price range
    fireEvent.click(screen.getByTestId('price-range-2')); // $500 - $1,000
    
    // Select condition
    fireEvent.click(screen.getByTestId('condition-good'));
    
    // Click Apply Filters button
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));
    
    // Verify router.push was called with correct URL
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('/products?category=accessories&minPrice=500&maxPrice=1000&condition=good')
    );
    
    // Change selections
    fireEvent.click(screen.getByLabelText('Decorations'));
    fireEvent.click(screen.getByTestId('price-range-3')); // Over $1,000
    fireEvent.click(screen.getByTestId('condition-fair'));
    
    // Click Apply Filters button again
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));
    
    // Verify router.push was called with updated URL
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('/products?category=decorations&minPrice=1000&condition=fair')
    );
  });
});
