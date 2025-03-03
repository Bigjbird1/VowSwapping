import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '@/components/product/ProductCard';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

// Mock the stores
jest.mock('@/store/cartStore');
jest.mock('@/store/wishlistStore');

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 'product-1',
    title: 'Test Product',
    price: 99.99,
    discountPrice: 79.99,
    images: ['https://example.com/image.jpg'],
    category: 'ACCESSORIES',
    condition: 'NEW',
    seller: {
      id: 'seller-1',
      shopName: 'Test Shop',
    },
  };

  const addToCart = jest.fn();
  const addToWishlist = jest.fn();
  const removeFromWishlist = jest.fn();
  const isInWishlist = jest.fn();

  beforeEach(() => {
    // Setup mock implementations
    useCartStore.mockReturnValue({
      addItem: addToCart,
    });

    useWishlistStore.mockReturnValue({
      addItem: addToWishlist,
      removeItem: removeFromWishlist,
      isInWishlist: isInWishlist.mockReturnValue(false),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Test Shop')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });

  it('shows correct discount percentage', () => {
    render(<ProductCard product={mockProduct} />);
    
    // 20% discount from 99.99 to 79.99
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('calls addToCart when add to cart button is clicked', () => {
    render(<ProductCard product={mockProduct} />);
    
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);
    
    expect(addToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('toggles wishlist when wishlist button is clicked', () => {
    render(<ProductCard product={mockProduct} />);
    
    const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
    fireEvent.click(wishlistButton);
    
    expect(addToWishlist).toHaveBeenCalledWith(mockProduct);
  });

  it('removes from wishlist when product is in wishlist', () => {
    // Mock product is in wishlist
    useWishlistStore.mockReturnValue({
      addItem: addToWishlist,
      removeItem: removeFromWishlist,
      isInWishlist: isInWishlist.mockReturnValue(true),
    });

    render(<ProductCard product={mockProduct} />);
    
    const wishlistButton = screen.getByRole('button', { name: /remove from wishlist/i });
    fireEvent.click(wishlistButton);
    
    expect(removeFromWishlist).toHaveBeenCalledWith(mockProduct.id);
  });

  it('renders product without discount correctly', () => {
    const productWithoutDiscount = {
      ...mockProduct,
      discountPrice: null,
    };

    render(<ProductCard product={productWithoutDiscount} />);
    
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.queryByText('-20%')).not.toBeInTheDocument();
  });
});
