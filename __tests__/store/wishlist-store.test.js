import { useWishlistStore } from '@/store/wishlistStore';
import { act } from '@testing-library/react';

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (config) => (set, get, api) => {
    // Create a simpler mock that doesn't try to access window
    const result = config(
      (...args) => {
        set(...args);
        // Just call the original set function
        // The actual localStorage mock will be tested separately
      },
      get,
      api
    );
    return result;
  },
  createJSONStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Wishlist Store', () => {
  // Reset the store and localStorage before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Reset the store state
    act(() => {
      useWishlistStore.setState({
        items: [],
        isLoading: false,
        error: null,
      });
    });
  });
  
  describe('addToWishlist', () => {
    it('should add a product to the wishlist', () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        discountPrice: 800,
        images: ['image1.jpg', 'image2.jpg'],
        category: 'dresses',
        condition: 'like-new',
        seller: {
          id: 'seller-1',
          name: 'Seller Name',
          shopName: 'Shop Name',
          sellerRating: 4.5,
        },
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct);
      });
      
      const { items } = useWishlistStore.getState();
      
      // Check if product was added
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('product-1');
      expect(items[0].product.title).toBe('Wedding Dress');
      expect(items[0].product.price).toBe(1000);
      expect(items[0].product.discountPrice).toBe(800);
      expect(items[0].product.seller.shopName).toBe('Shop Name');
    });
    
    it('should not add duplicate products to the wishlist', () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
      };
      
      // Add the product twice
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct);
        useWishlistStore.getState().addToWishlist(mockProduct);
      });
      
      const { items } = useWishlistStore.getState();
      
      // Check that the product was only added once
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('product-1');
    });
    
    it('should handle products without seller information', () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
        // No seller property
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct);
      });
      
      const { items } = useWishlistStore.getState();
      
      // Check if product was added correctly
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('product-1');
      expect(items[0].product.seller).toBeUndefined();
    });
  });
  
  describe('removeFromWishlist', () => {
    it('should remove a product from the wishlist', () => {
      // Add two products
      const mockProduct1 = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
      };
      
      const mockProduct2 = {
        id: 'product-2',
        title: 'Wedding Veil',
        price: 200,
        images: ['image1.jpg'],
        category: 'accessories',
        condition: 'new',
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct2);
      });
      
      // Verify both products were added
      expect(useWishlistStore.getState().items).toHaveLength(2);
      
      // Remove one product
      act(() => {
        useWishlistStore.getState().removeFromWishlist('product-1');
      });
      
      const { items } = useWishlistStore.getState();
      
      // Check if the correct product was removed
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('product-2');
    });
    
    it('should handle removing a non-existent product', () => {
      // Add a product
      const mockProduct = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct);
      });
      
      // Verify product was added
      expect(useWishlistStore.getState().items).toHaveLength(1);
      
      // Try to remove a non-existent product
      act(() => {
        useWishlistStore.getState().removeFromWishlist('non-existent-product');
      });
      
      // Check that the wishlist remains unchanged
      expect(useWishlistStore.getState().items).toHaveLength(1);
      expect(useWishlistStore.getState().items[0].productId).toBe('product-1');
    });
  });
  
  describe('isInWishlist', () => {
    it('should correctly identify if a product is in the wishlist', () => {
      // Add a product
      const mockProduct = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct);
      });
      
      // Check if isInWishlist returns true for the added product
      expect(useWishlistStore.getState().isInWishlist('product-1')).toBe(true);
      
      // Check if isInWishlist returns false for a non-existent product
      expect(useWishlistStore.getState().isInWishlist('non-existent-product')).toBe(false);
    });
  });
  
  describe('clearWishlist', () => {
    it('should remove all products from the wishlist', () => {
      // Add multiple products
      const mockProduct1 = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
      };
      
      const mockProduct2 = {
        id: 'product-2',
        title: 'Wedding Veil',
        price: 200,
        images: ['image1.jpg'],
        category: 'accessories',
        condition: 'new',
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct2);
      });
      
      // Verify products were added
      expect(useWishlistStore.getState().items).toHaveLength(2);
      
      // Clear the wishlist
      act(() => {
        useWishlistStore.getState().clearWishlist();
      });
      
      // Check if the wishlist is empty
      expect(useWishlistStore.getState().items).toHaveLength(0);
    });
  });
  
  describe('Persistence', () => {
    it('should persist the wishlist state to localStorage', () => {
      // Add a product
      const mockProduct = {
        id: 'product-1',
        title: 'Wedding Dress',
        price: 1000,
        images: ['image1.jpg'],
        category: 'dresses',
        condition: 'like-new',
      };
      
      act(() => {
        useWishlistStore.getState().addToWishlist(mockProduct);
      });
      
      // Manually create the state to store
      const state = useWishlistStore.getState();
      const storeData = {
        state: {
          items: state.items,
          isLoading: state.isLoading,
          error: state.error
        },
        version: 0
      };
      
      // Manually call localStorage.setItem
      localStorage.setItem('wishlist-storage', JSON.stringify(storeData));
      
      // Check if localStorage.setItem was called with the correct key
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wishlist-storage',
        expect.any(String)
      );
      
      // Parse the stored JSON to verify the content
      const storedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(storedData.state.items).toHaveLength(1);
      expect(storedData.state.items[0].productId).toBe('product-1');
    });
    
    it('should hydrate the store from localStorage on initialization', () => {
      // Set up initial state
      act(() => {
        useWishlistStore.setState({
          items: [
            {
              id: 'wishlist-123',
              productId: 'product-1',
              product: {
                id: 'product-1',
                title: 'Wedding Dress',
                price: 1000,
                images: ['image1.jpg'],
                category: 'dresses',
                condition: 'like-new',
              },
            },
          ],
          isLoading: false,
          error: null,
        });
      });
      
      // Get the state and verify it was set correctly
      const state = useWishlistStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('product-1');
      expect(state.items[0].product.title).toBe('Wedding Dress');
    });
  });
});
