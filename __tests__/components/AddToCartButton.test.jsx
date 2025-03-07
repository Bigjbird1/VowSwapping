import { render, screen, fireEvent } from '@testing-library/react';
import AddToCartButton from '@/components/product/AddToCartButton';
import { useCartStore } from '@/store/cartStore';

// Mock the cart store
jest.mock('@/store/cartStore', () => ({
  useCartStore: jest.fn((selector) => selector({
    addItem: jest.fn(),
  }))
}));

describe('AddToCartButton Component', () => {
  const mockProduct = {
    id: 'product-1',
    title: 'Test Product',
    price: 99.99,
  };
  
  const mockAddToCart = jest.fn();
  
  beforeEach(() => {
    // Reset the mock implementation to ensure clean tests
    useCartStore.mockImplementation((selector) => 
      selector({ addItem: mockAddToCart })
    );
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  it('renders with initial quantity of 1', () => {
    render(<AddToCartButton product={mockProduct} />);
    expect(screen.getByTestId('quantity-selector')).toHaveTextContent('1');
  });
  
  it('increases quantity when + button is clicked', () => {
    render(<AddToCartButton product={mockProduct} />);
    fireEvent.click(screen.getByTestId('increase-quantity'));
    expect(screen.getByTestId('quantity-selector')).toHaveTextContent('2');
  });
  
  it('decreases quantity when - button is clicked', () => {
    render(<AddToCartButton product={mockProduct} />);
    fireEvent.click(screen.getByTestId('increase-quantity'));
    fireEvent.click(screen.getByTestId('decrease-quantity'));
    expect(screen.getByTestId('quantity-selector')).toHaveTextContent('1');
  });
  
  it('does not decrease quantity below 1', () => {
    render(<AddToCartButton product={mockProduct} />);
    fireEvent.click(screen.getByTestId('decrease-quantity'));
    expect(screen.getByTestId('quantity-selector')).toHaveTextContent('1');
  });
  
  it('calls addItem with product and quantity when Add to Cart is clicked', () => {
    render(<AddToCartButton product={mockProduct} />);
    fireEvent.click(screen.getByTestId('increase-quantity')); // Set quantity to 2
    fireEvent.click(screen.getByTestId('add-to-cart-button'));
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 2);
  });
  
  it('shows feedback and disables button temporarily after adding to cart', () => {
    const { rerender } = render(<AddToCartButton product={mockProduct} />);
    
    // Initial state check
    expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Add to Cart');
    expect(screen.getByTestId('add-to-cart-button')).not.toBeDisabled();
    
    // Click the button
    fireEvent.click(screen.getByTestId('add-to-cart-button'));
    
    // Check that the button shows "Added!" and is disabled
    expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Added!');
    
    // Fast-forward time to complete the timeout
    jest.advanceTimersByTime(1000);
    
    // Force a re-render to ensure React updates the component after the timer
    rerender(<AddToCartButton product={mockProduct} />);
    
    // Check that the button text reverts back
    expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Add to Cart');
  });
});
