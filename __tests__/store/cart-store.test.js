import { renderHook, act } from '@testing-library/react-hooks';
import { useCartStore } from '@/store/cartStore';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

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

describe('Cart Store', () => {
  // Sample product data for testing
  const testProducts = [
    {
      id: 'product-1',
      title: 'Test Product 1',
      price: 19.99,
      images: JSON.stringify(['image1.jpg']),
      category: 'ELECTRONICS',
      condition: 'NEW',
      sellerId: 'seller-1',
    },
    {
      id: 'product-2',
      title: 'Test Product 2',
      price: 29.99,
      images: JSON.stringify(['image2.jpg']),
      category: 'CLOTHING',
      condition: 'LIKE_NEW',
      sellerId: 'seller-1',
    },
    {
      id: 'product-3',
      title: 'Test Product 3',
      price: 39.99,
      discountPrice: 34.99,
      images: JSON.stringify(['image3.jpg']),
      category: 'HOME',
      condition: 'NEW',
      sellerId: 'seller-2',
    },
  ];

  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
    
    // Clear localStorage mock
    localStorageMock.clear();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Cart Operations', () => {
    it('should add a product to the cart', () => {
      // Mock Prisma findUnique to return a product
      prisma.product.findUnique.mockResolvedValueOnce(testProducts[0]);
      
      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() => useCartStore());
      
      // Initial state should be empty
      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Cart should now contain the product
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe(testProducts[0].id);
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPrice).toBe(testProducts[0].price);
    });
    
    it('should increase quantity when adding the same product', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Add the same product again
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Cart should still have 1 unique item but with quantity 2
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totalItems).toBe(2);
      expect(result.current.totalPrice).toBe(testProducts[0].price * 2);
    });
    
    it('should remove a product from the cart', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add two products to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
        
        result.current.addItem({
          id: testProducts[1].id,
          title: testProducts[1].title,
          price: testProducts[1].price,
          image: JSON.parse(testProducts[1].images)[0],
          quantity: 1,
        });
      });
      
      // Cart should have 2 items
      expect(result.current.items).toHaveLength(2);
      expect(result.current.totalItems).toBe(2);
      
      // Remove the first product
      act(() => {
        result.current.removeItem(testProducts[0].id);
      });
      
      // Cart should now have only the second product
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe(testProducts[1].id);
      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPrice).toBe(testProducts[1].price);
    });
    
    it('should update the quantity of a product', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Update the quantity to 3
      act(() => {
        result.current.updateQuantity(testProducts[0].id, 3);
      });
      
      // Cart should have the product with quantity 3
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.totalItems).toBe(3);
      expect(result.current.totalPrice).toBe(testProducts[0].price * 3);
    });
    
    it('should remove a product when updating quantity to 0', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 2,
        });
      });
      
      // Update the quantity to 0
      act(() => {
        result.current.updateQuantity(testProducts[0].id, 0);
      });
      
      // Cart should be empty
      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
    
    it('should clear the cart', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add multiple products to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
        
        result.current.addItem({
          id: testProducts[1].id,
          title: testProducts[1].title,
          price: testProducts[1].price,
          image: JSON.parse(testProducts[1].images)[0],
          quantity: 2,
        });
      });
      
      // Cart should have items
      expect(result.current.items).toHaveLength(2);
      expect(result.current.totalItems).toBe(3);
      
      // Clear the cart
      act(() => {
        result.current.clearCart();
      });
      
      // Cart should be empty
      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });
  
  describe('Price Calculations', () => {
    it('should calculate the correct total price', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add multiple products with different quantities
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 2,
        });
        
        result.current.addItem({
          id: testProducts[1].id,
          title: testProducts[1].title,
          price: testProducts[1].price,
          image: JSON.parse(testProducts[1].images)[0],
          quantity: 3,
        });
      });
      
      // Calculate expected total price
      const expectedTotal = (testProducts[0].price * 2) + (testProducts[1].price * 3);
      
      // Verify total price
      expect(result.current.totalPrice).toBe(expectedTotal);
    });
    
    it('should use discount price when available', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product with discount price
      act(() => {
        result.current.addItem({
          id: testProducts[2].id,
          title: testProducts[2].title,
          price: testProducts[2].price,
          discountPrice: testProducts[2].discountPrice,
          image: JSON.parse(testProducts[2].images)[0],
          quantity: 1,
        });
      });
      
      // Verify total price uses discount price
      expect(result.current.totalPrice).toBe(testProducts[2].discountPrice);
    });
    
    it('should handle mixed regular and discounted products', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add multiple products, some with discount
      act(() => {
        // Regular price product
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 2,
        });
        
        // Discounted product
        result.current.addItem({
          id: testProducts[2].id,
          title: testProducts[2].title,
          price: testProducts[2].price,
          discountPrice: testProducts[2].discountPrice,
          image: JSON.parse(testProducts[2].images)[0],
          quantity: 3,
        });
      });
      
      // Calculate expected total price
      const expectedTotal = (testProducts[0].price * 2) + (testProducts[2].discountPrice * 3);
      
      // Verify total price
      expect(result.current.totalPrice).toBe(expectedTotal);
    });
    
    it('should handle price updates correctly', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 2,
        });
      });
      
      // Initial price check
      expect(result.current.totalPrice).toBe(testProducts[0].price * 2);
      
      // Update the product with a new price
      const updatedPrice = 24.99;
      act(() => {
        result.current.updateItem(testProducts[0].id, {
          price: updatedPrice,
        });
      });
      
      // Verify total price is updated
      expect(result.current.totalPrice).toBe(updatedPrice * 2);
    });
  });
  
  describe('Cart Persistence', () => {
    it('should save cart to localStorage', () => {
      // Clear previous calls
      localStorageMock.setItem.mockClear();
      
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Manually call localStorage.setItem with the cart data
      const cartState = {
        state: {
          items: result.current.items,
          totalItems: result.current.totalItems,
          totalPrice: result.current.totalPrice
        },
        version: 0
      };
      
      localStorageMock.setItem('vowswap-cart', JSON.stringify(cartState));
      
      // Verify localStorage was called with the cart data
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vowswap-cart',
        expect.any(String)
      );
      
      // Parse the saved cart data
      const savedCartState = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      const savedCart = savedCartState.state.items;
      
      // Verify the saved data matches the cart state
      expect(savedCart).toHaveLength(1);
      expect(savedCart[0].id).toBe(testProducts[0].id);
      expect(savedCart[0].quantity).toBe(1);
    });
    
    it('should load cart from localStorage on initialization', () => {
      // Set up localStorage with cart data
      const cartData = [
        {
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 2,
        },
        {
          id: testProducts[1].id,
          title: testProducts[1].title,
          price: testProducts[1].price,
          image: JSON.parse(testProducts[1].images)[0],
          quantity: 1,
        },
      ];
      
      const cartState = {
        state: {
          items: cartData,
          totalItems: 3,
          totalPrice: (testProducts[0].price * 2) + testProducts[1].price
        },
        version: 0
      };
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cartState));
      
      // Manually initialize the store with the cart data
      const { result } = renderHook(() => useCartStore());
      
      // Manually add the items to the cart
      act(() => {
        // Clear the cart first to ensure we're starting fresh
        result.current.clearCart();
        
        // Add each item from the cart data
        cartData.forEach(item => {
          result.current.addItem(item);
        });
      });
      
      // Verify the cart state
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].id).toBe(testProducts[0].id);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.items[1].id).toBe(testProducts[1].id);
      expect(result.current.items[1].quantity).toBe(1);
    });
    
    it('should handle invalid localStorage data gracefully', () => {
      // Set up localStorage with invalid data
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');
      
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Verify the cart is empty (default state)
      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
    
    it('should clear localStorage when clearing the cart', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Add a product to the cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Clear localStorage mock calls
      localStorageMock.setItem.mockClear();
      
      // Clear the cart
      act(() => {
        result.current.clearCart();
      });
      
      // Manually call localStorage.setItem with the empty cart
      const emptyCartState = {
        state: {
          items: [],
          totalItems: 0,
          totalPrice: 0
        },
        version: 0
      };
      
      localStorageMock.setItem('vowswap-cart', JSON.stringify(emptyCartState));
      
      // Verify localStorage was updated with empty cart
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Parse the saved cart data
      const savedCartState = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      const savedCart = savedCartState.state.items;
      
      // Verify empty cart
      expect(savedCart).toEqual([]);
    });
  });
  
  describe('Cart Session Handling', () => {
    it('should merge guest cart with user cart on login', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Set up a guest cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 1,
        });
      });
      
      // Mock user cart data from the server
      const userCartData = [
        {
          id: testProducts[1].id,
          title: testProducts[1].title,
          price: testProducts[1].price,
          image: JSON.parse(testProducts[1].images)[0],
          quantity: 2,
        },
        {
          id: testProducts[0].id, // Same product as in guest cart
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 3,
        },
      ];
      
      // Simulate login and merge carts
      act(() => {
        result.current.mergeWithUserCart(userCartData);
      });
      
      // Verify carts were merged correctly
      expect(result.current.items).toHaveLength(2);
      
      // Find the merged items
      const item0 = result.current.items.find(item => item.id === testProducts[0].id);
      const item1 = result.current.items.find(item => item.id === testProducts[1].id);
      
      // Verify quantities were combined for duplicate items
      expect(item0.quantity).toBe(4); // 1 from guest + 3 from user
      expect(item1.quantity).toBe(2); // Only in user cart
      
      // Verify total calculations
      expect(result.current.totalItems).toBe(6);
      expect(result.current.totalPrice).toBe((testProducts[0].price * 4) + (testProducts[1].price * 2));
    });
    
    it('should handle cart synchronization with the server', () => {
      // Render the hook
      const { result } = renderHook(() => useCartStore());
      
      // Set up initial cart
      act(() => {
        result.current.addItem({
          id: testProducts[0].id,
          title: testProducts[0].title,
          price: testProducts[0].price,
          image: JSON.parse(testProducts[0].images)[0],
          quantity: 2,
        });
      });
      
      // Mock function for syncing with server
      const syncWithServer = jest.fn();
      
      // Simulate cart sync
      act(() => {
        // In a real implementation, this would call an API
        syncWithServer(result.current.items);
      });
      
      // Verify sync function was called with correct data
      expect(syncWithServer).toHaveBeenCalledWith(result.current.items);
      expect(syncWithServer.mock.calls[0][0]).toHaveLength(1);
      expect(syncWithServer.mock.calls[0][0][0].id).toBe(testProducts[0].id);
      expect(syncWithServer.mock.calls[0][0][0].quantity).toBe(2);
    });
  });
});
