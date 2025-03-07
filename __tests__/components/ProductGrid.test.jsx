import { render, screen } from '@testing-library/react';
import ProductGrid from '@/components/product/ProductGrid';

// Mock the ProductCard component
jest.mock('@/components/product/ProductCard', () => {
  return function MockProductCard({ product }) {
    return <div data-testid={`product-card-${product.id}`}>{product.title}</div>;
  };
});

describe('ProductGrid Component', () => {
  const mockProducts = [
    {
      id: 'product-1',
      title: 'Test Product 1',
      price: 99.99,
      images: ['https://example.com/image1.jpg'],
      seller: { id: 'seller-1', shopName: 'Test Shop' },
    },
    {
      id: 'product-2',
      title: 'Test Product 2',
      price: 149.99,
      images: ['https://example.com/image2.jpg'],
      seller: { id: 'seller-1', shopName: 'Test Shop' },
    },
    {
      id: 'product-3',
      title: 'Test Product 3',
      price: 199.99,
      images: ['https://example.com/image3.jpg'],
      seller: { id: 'seller-1', shopName: 'Test Shop' },
    },
  ];

  it('renders all products correctly', () => {
    render(<ProductGrid products={mockProducts} />);
    
    expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-product-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-product-3')).toBeInTheDocument();
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Test Product 3')).toBeInTheDocument();
  });
  
  it('renders empty state when no products are provided', () => {
    render(<ProductGrid products={[]} />);
    
    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search criteria.')).toBeInTheDocument();
  });
  
  it('applies correct grid classes for 2 columns', () => {
    const { container } = render(<ProductGrid products={mockProducts} columns={2} />);
    
    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('sm:grid-cols-2');
    expect(gridElement).not.toHaveClass('lg:grid-cols-3');
  });
  
  it('applies correct grid classes for 3 columns (default)', () => {
    const { container } = render(<ProductGrid products={mockProducts} />);
    
    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('sm:grid-cols-2');
    expect(gridElement).toHaveClass('lg:grid-cols-3');
    expect(gridElement).not.toHaveClass('xl:grid-cols-4');
  });
  
  it('applies correct grid classes for 4 columns', () => {
    const { container } = render(<ProductGrid products={mockProducts} columns={4} />);
    
    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('sm:grid-cols-2');
    expect(gridElement).toHaveClass('lg:grid-cols-3');
    expect(gridElement).toHaveClass('xl:grid-cols-4');
  });
});
