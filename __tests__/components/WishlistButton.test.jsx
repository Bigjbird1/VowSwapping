import { render, screen, fireEvent } from '@testing-library/react';
import WishlistButton from '@/components/product/WishlistButton';
import { useWishlistStore } from '@/store/wishlistStore';

// Mock the wishlist store
jest.mock('@/store/wishlistStore');

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Heart: () => <div data-testid="heart-icon" />
}));

describe('WishlistButton Component', () => {
  const mockProduct = {
    id: 'product-1',
    title: 'Test Product',
    price: 99.99,
  };
  
  const mockAddToWishlist = jest.fn();
  const mockRemoveFromWishlist = jest.fn();
  const mockIsInWishlist = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly when product is not in wishlist', () => {
    mockIsInWishlist.mockReturnValue(false);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    render(<WishlistButton product={mockProduct} />);
    
    expect(mockIsInWishlist).toHaveBeenCalledWith(mockProduct.id);
    expect(screen.getByTestId('wishlist-button')).toHaveAttribute('aria-label', 'Add to wishlist');
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });
  
  it('renders correctly when product is in wishlist', () => {
    mockIsInWishlist.mockReturnValue(true);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    render(<WishlistButton product={mockProduct} />);
    
    expect(mockIsInWishlist).toHaveBeenCalledWith(mockProduct.id);
    expect(screen.getByTestId('wishlist-button')).toHaveAttribute('aria-label', 'Remove from wishlist');
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });
  
  it('calls addToWishlist when clicked and product is not in wishlist', () => {
    mockIsInWishlist.mockReturnValue(false);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    render(<WishlistButton product={mockProduct} />);
    
    const button = screen.getByTestId('wishlist-button');
    fireEvent.click(button);
    
    expect(mockAddToWishlist).toHaveBeenCalledWith(mockProduct);
    expect(mockRemoveFromWishlist).not.toHaveBeenCalled();
  });
  
  it('calls removeFromWishlist when clicked and product is in wishlist', () => {
    mockIsInWishlist.mockReturnValue(true);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    render(<WishlistButton product={mockProduct} />);
    
    const button = screen.getByTestId('wishlist-button');
    fireEvent.click(button);
    
    expect(mockRemoveFromWishlist).toHaveBeenCalledWith(mockProduct.id);
    expect(mockAddToWishlist).not.toHaveBeenCalled();
  });
  
  it('renders with different sizes based on size prop', () => {
    mockIsInWishlist.mockReturnValue(false);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    const { rerender } = render(<WishlistButton product={mockProduct} size="sm" />);
    expect(screen.getByTestId('wishlist-button')).toHaveClass('p-1.5');
    
    rerender(<WishlistButton product={mockProduct} size="md" />);
    expect(screen.getByTestId('wishlist-button')).toHaveClass('p-2');
    
    rerender(<WishlistButton product={mockProduct} size="lg" />);
    expect(screen.getByTestId('wishlist-button')).toHaveClass('p-3');
  });
  
  it('renders with text when showText prop is true', () => {
    mockIsInWishlist.mockReturnValue(false);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    render(<WishlistButton product={mockProduct} showText={true} />);
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    
    // Test with product in wishlist
    mockIsInWishlist.mockReturnValue(true);
    
    render(<WishlistButton product={mockProduct} showText={true} />);
    
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
  
  it('applies custom className when provided', () => {
    mockIsInWishlist.mockReturnValue(false);
    
    useWishlistStore.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });
    
    render(<WishlistButton product={mockProduct} className="custom-class" />);
    
    expect(screen.getByTestId('wishlist-button')).toHaveClass('custom-class');
  });
});
