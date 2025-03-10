import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProductFilters from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/products'),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Product Search and Filtering Integration', () => {
  // Mock products data
  const mockProducts = [
    {
      id: 'product-1',
      title: 'Elegant Wedding Dress',
      price: 999.99,
      discountPrice: 799.99,
      images: ['/dress1.jpg'],
      category: 'DRESSES',
      condition: 'LIKE_NEW',
      sellerId: 'seller-1',
      description: 'Beautiful white wedding dress',
      tags: ['elegant', 'white', 'lace'],
    },
    {
      id: 'product-2',
      title: 'Wedding Veil',
      price: 199.99,
      images: ['/veil1.jpg'],
      category: 'ACCESSORIES',
      condition: 'NEW',
      sellerId: 'seller-2',
      description: 'Long white veil with lace trim',
      tags: ['veil', 'white', 'lace'],
    },
    {
      id: 'product-3',
      title: 'Bridesmaid Dress',
      price: 299.99,
      images: ['/dress2.jpg'],
      category: 'DRESSES',
      condition: 'USED',
      sellerId: 'seller-1',
      description: 'Pink bridesmaid dress',
      tags: ['bridesmaid', 'pink'],
    },
  ];

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
      json: jest.fn().mockResolvedValue({ products: mockProducts, total: mockProducts.length }),
    });
  });

  describe('Filter Combinations', () => {
    it('should apply multiple filters correctly', async () => {
      render(
        <div>
          <ProductFilters />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Apply category filter for DRESSES
      const dressesRadio = screen.getByLabelText('Dresses');
      fireEvent.click(dressesRadio);
      
      // Apply condition filter for LIKE_NEW
      const likeNewRadio = screen.getByLabelText('Like New');
      fireEvent.click(likeNewRadio);
      
      // Apply price range filter for $500-$1000
      const priceRangeRadio = screen.getByLabelText('$500 - $1,000');
      fireEvent.click(priceRangeRadio);
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with correct query parameters
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=dresses')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('condition=like-new')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('minPrice=500')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('maxPrice=1000')
      );
    });
    
    it('should clear all filters correctly', async () => {
      // Mock URL with existing filters
      const mockSearchParams = new URLSearchParams({
        category: 'dresses',
        condition: 'like-new',
        minPrice: '500',
        maxPrice: '1000',
      });
      
      require('next/navigation').useSearchParams.mockReturnValue(mockSearchParams);
      
      render(
        <div>
          <ProductFilters 
            selectedCategory="dresses"
            selectedCondition="like-new"
            selectedMinPrice={500}
            selectedMaxPrice={1000}
          />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Find and click reset filters button
      const resetButton = screen.getByTestId('reset-filters-button');
      fireEvent.click(resetButton);
      
      // Verify router was called with no query parameters
      expect(mockPush).toHaveBeenCalledWith('/products');
    });
  });
  
  describe('Search with Filters', () => {
    it('should combine search query with filters', async () => {
      render(
        <div>
          <ProductFilters />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Enter search query
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'wedding dress' } });
      
      // Apply category filter
      const dressesRadio = screen.getByLabelText('Dresses');
      fireEvent.click(dressesRadio);
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with both search query and filter
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('q=wedding+dress')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=dresses')
      );
    });
    
    it('should handle search with special characters', async () => {
      render(
        <div>
          <ProductFilters />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Enter search query with special characters
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'wedding & reception dress+veil' } });
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with properly encoded search query
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('q=wedding+%26+reception+dress%2Bveil')
      );
    });
  });
  
  describe('Category Navigation', () => {
    it('should navigate to category page when category is selected', async () => {
      render(
        <div>
          <ProductFilters />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Select category
      const accessoriesRadio = screen.getByLabelText('Accessories');
      fireEvent.click(accessoriesRadio);
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with category parameter
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=accessories')
      );
    });
    
    it('should maintain other filters when changing category', async () => {
      // Mock URL with existing filters
      const mockSearchParams = new URLSearchParams({
        condition: 'new',
        minPrice: '100',
        maxPrice: '500',
      });
      
      require('next/navigation').useSearchParams.mockReturnValue(mockSearchParams);
      
      render(
        <div>
          <ProductFilters 
            selectedCondition="new"
            selectedMinPrice={100}
            selectedMaxPrice={500}
          />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Select category
      const accessoriesRadio = screen.getByLabelText('Accessories');
      fireEvent.click(accessoriesRadio);
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with all parameters
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=accessories')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('condition=new')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('minPrice=100')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('maxPrice=500')
      );
    });
  });
  
  describe('Results Pagination', () => {
    it('should handle pagination with filters', async () => {
      // Mock a larger product set
      const manyProducts = Array(20).fill().map((_, i) => ({
        id: `product-${i + 1}`,
        title: `Product ${i + 1}`,
        price: 100 + i * 10,
        images: [`/images/image${i + 1}.jpg`], // Already has leading slash
        category: i % 2 === 0 ? 'DRESSES' : 'ACCESSORIES',
        condition: i % 3 === 0 ? 'NEW' : 'LIKE_NEW',
      }));
      
      // Mock fetch to return paginated results
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          products: manyProducts.slice(0, 12), 
          total: manyProducts.length,
          totalPages: Math.ceil(manyProducts.length / 12)
        }),
      });
      
      // Mock the onPageChange function
      const mockOnPageChange = jest.fn();
      
      // Render with the mock function
      const { unmount } = render(
        <div>
          <ProductFilters />
          <ProductGrid 
            products={manyProducts.slice(0, 12)}
            currentPage={1}
            totalPages={Math.ceil(manyProducts.length / 12)}
            onPageChange={mockOnPageChange}
          />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Apply category filter
      const dressesRadio = screen.getByLabelText('Dresses');
      fireEvent.click(dressesRadio);
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with category parameter
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=dresses')
      );
      
      // Find and click next page button
      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      fireEvent.click(nextPageButton);
      
      // Verify onPageChange was called with page 2
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
    
    it('should reset to page 1 when filters change', async () => {
      // Mock URL with existing page parameter
      const mockSearchParams = new URLSearchParams({
        page: '3',
      });
      
      require('next/navigation').useSearchParams.mockReturnValue(mockSearchParams);
      
      render(
        <div>
          <ProductFilters />
          <ProductGrid />
        </div>
      );
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Apply category filter
      const dressesRadio = screen.getByLabelText('Dresses');
      fireEvent.click(dressesRadio);
      
      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      fireEvent.click(applyButton);
      
      // Verify router was called with page reset to 1
      expect(mockPush).toHaveBeenCalledWith(
        expect.not.stringContaining('page=3')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=dresses')
      );
    });
  });
});
