import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  
  const mockSellers = [
    { id: 'seller-1', name: 'Seller 1', shopName: 'Shop 1' },
    { id: 'seller-2', name: 'Seller 2', shopName: 'Shop 2' },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    usePathname.mockReturnValue('/products');
    
    // Mock successful fetch response for sellers
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ sellers: mockSellers }),
    });
  });
  
  it('renders all filter sections correctly', async () => {
    render(<ProductFilters />);
    
    // Check for filter sections
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Sellers')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByTestId('apply-filters-button')).toBeInTheDocument();
    expect(screen.getByTestId('reset-filters-button')).toBeInTheDocument();
    
    // Wait for sellers to load
    await waitFor(() => {
      expect(screen.getByText('Shop 1')).toBeInTheDocument();
      expect(screen.getByText('Shop 2')).toBeInTheDocument();
    });
  });
  
  it('handles search input correctly', () => {
    render(<ProductFilters />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'wedding dress' } });
    
    expect(searchInput.value).toBe('wedding dress');
  });
  
  it('handles category selection correctly', () => {
    render(<ProductFilters />);
    
    const dressesRadio = screen.getByLabelText('Dresses');
    fireEvent.click(dressesRadio);
    
    expect(dressesRadio).toBeChecked();
  });
  
  it('handles price range selection correctly', () => {
    render(<ProductFilters />);
    
    const priceRange = screen.getByTestId('price-range-1'); // $100 - $500
    fireEvent.click(priceRange);
    
    expect(priceRange).toBeChecked();
  });
  
  it('handles condition selection correctly', () => {
    render(<ProductFilters />);
    
    const newCondition = screen.getByTestId('condition-new');
    fireEvent.click(newCondition);
    
    expect(newCondition).toBeChecked();
  });
  
  it('applies filters when Apply Filters button is clicked', () => {
    render(<ProductFilters />);
    
    // Set some filters
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'wedding dress' } });
    fireEvent.click(screen.getByLabelText('Dresses'));
    fireEvent.click(screen.getByTestId('price-range-1')); // $100 - $500
    fireEvent.click(screen.getByTestId('condition-new'));
    
    // Click apply filters
    fireEvent.click(screen.getByTestId('apply-filters-button'));
    
    // Check that router.push was called with the correct URL
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('/products?category=dresses&minPrice=100&maxPrice=500&condition=new&q=wedding+dress')
    );
  });
  
  it('resets filters when Reset button is clicked', () => {
    render(<ProductFilters />);
    
    // Set some filters
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'wedding dress' } });
    fireEvent.click(screen.getByLabelText('Dresses'));
    
    // Reset filters
    fireEvent.click(screen.getByTestId('reset-filters-button'));
    
    // Check that router.push was called with just the pathname
    expect(mockRouter.push).toHaveBeenCalledWith('/products');
    
    // Check that the UI is reset (search input should be empty)
    expect(screen.getByTestId('search-input').value).toBe('');
  });
  
  it('initializes with provided filter values', () => {
    render(
      <ProductFilters
        selectedCategory="dresses"
        selectedMinPrice={100}
        selectedMaxPrice={500}
        selectedCondition="new"
        searchQuery="wedding dress"
      />
    );
    
    // Check that filters are initialized with the provided values
    expect(screen.getByTestId('search-input').value).toBe('wedding dress');
    expect(screen.getByLabelText('Dresses')).toBeChecked();
    expect(screen.getByTestId('price-range-1')).toBeChecked(); // $100 - $500
    expect(screen.getByTestId('condition-new')).toBeChecked();
  });
  
  it('handles fetch error for sellers gracefully', async () => {
    // Mock fetch error
    fetch.mockRejectedValue(new Error('Failed to fetch'));
    
    render(<ProductFilters />);
    
    // Check that the component renders without crashing
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Wait for sellers section to show error state
    await waitFor(() => {
      expect(screen.getByText('Sellers')).toBeInTheDocument();
      expect(screen.getByText('No sellers available')).toBeInTheDocument();
    });
  });
});
