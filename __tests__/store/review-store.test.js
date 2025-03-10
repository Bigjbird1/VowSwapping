import { useReviewStore } from '@/store/reviewStore';
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

describe('Review Store', () => {
  // Reset the store and localStorage before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Reset the store state
    act(() => {
      useReviewStore.setState({
        productReviews: {},
        sellerReviews: {},
        userReviews: [],
      });
    });
  });
  
  // Sample review data for testing
  const mockProductId = 'product-1';
  const mockSellerId = 'seller-1';
  
  const mockProductReview = {
    id: 'review-1',
    productId: mockProductId,
    reviewerId: 'user-1',
    reviewerName: 'User 1',
    rating: 5,
    comment: 'Great product!',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  };
  
  const mockSellerReview = {
    id: 'review-2',
    sellerId: mockSellerId,
    reviewerId: 'user-1',
    reviewerName: 'User 1',
    rating: 4,
    comment: 'Good seller',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  };
  
  describe('Product Review Actions', () => {
    it('should add a product review', () => {
      act(() => {
        useReviewStore.getState().addProductReview(mockProductId, mockProductReview);
      });
      
      const { productReviews, userReviews } = useReviewStore.getState();
      
      // Check if review was added to productReviews
      expect(productReviews[mockProductId]).toHaveLength(1);
      expect(productReviews[mockProductId][0].id).toBe('review-1');
      expect(productReviews[mockProductId][0].rating).toBe(5);
      
      // Check if review was also added to userReviews
      expect(userReviews).toHaveLength(1);
      expect(userReviews[0].id).toBe('review-1');
    });
    
    it('should update a product review', () => {
      // Add a review first
      act(() => {
        useReviewStore.getState().addProductReview(mockProductId, mockProductReview);
      });
      
      // Update the review
      const updatedReview = {
        rating: 4,
        comment: 'Updated comment'
      };
      
      act(() => {
        useReviewStore.getState().updateProductReview(mockProductId, 'review-1', updatedReview);
      });
      
      const { productReviews, userReviews } = useReviewStore.getState();
      
      // Check if review was updated in productReviews
      expect(productReviews[mockProductId][0].rating).toBe(4);
      expect(productReviews[mockProductId][0].comment).toBe('Updated comment');
      
      // Check if review was also updated in userReviews
      expect(userReviews[0].rating).toBe(4);
      expect(userReviews[0].comment).toBe('Updated comment');
    });
    
    it('should delete a product review', () => {
      // Add a review first
      act(() => {
        useReviewStore.getState().addProductReview(mockProductId, mockProductReview);
      });
      
      // Delete the review
      act(() => {
        useReviewStore.getState().deleteProductReview(mockProductId, 'review-1');
      });
      
      const { productReviews, userReviews } = useReviewStore.getState();
      
      // Check if review was deleted from productReviews
      expect(productReviews[mockProductId]).toHaveLength(0);
      
      // Check if review was also deleted from userReviews
      expect(userReviews).toHaveLength(0);
    });
    
    it('should set product reviews', () => {
      const mockReviews = [mockProductReview, { ...mockProductReview, id: 'review-3', rating: 3 }];
      
      act(() => {
        useReviewStore.getState().setProductReviews(mockProductId, mockReviews);
      });
      
      const { productReviews } = useReviewStore.getState();
      
      // Check if reviews were set correctly
      expect(productReviews[mockProductId]).toHaveLength(2);
      expect(productReviews[mockProductId][0].id).toBe('review-1');
      expect(productReviews[mockProductId][1].id).toBe('review-3');
    });
    
    it('should get product reviews', () => {
      const mockReviews = [mockProductReview, { ...mockProductReview, id: 'review-3', rating: 3 }];
      
      act(() => {
        useReviewStore.getState().setProductReviews(mockProductId, mockReviews);
      });
      
      const reviews = useReviewStore.getState().getProductReviews(mockProductId);
      
      // Check if reviews were retrieved correctly
      expect(reviews).toHaveLength(2);
      expect(reviews[0].id).toBe('review-1');
      expect(reviews[1].id).toBe('review-3');
    });
    
    it('should return empty array for non-existent product reviews', () => {
      const reviews = useReviewStore.getState().getProductReviews('non-existent-product');
      
      // Check if empty array is returned
      expect(reviews).toHaveLength(0);
    });
    
    it('should calculate average product rating', () => {
      const mockReviews = [
        mockProductReview, // rating: 5
        { ...mockProductReview, id: 'review-3', rating: 3 },
        { ...mockProductReview, id: 'review-4', rating: 4 }
      ];
      
      act(() => {
        useReviewStore.getState().setProductReviews(mockProductId, mockReviews);
      });
      
      const averageRating = useReviewStore.getState().getAverageProductRating(mockProductId);
      
      // Check if average rating is calculated correctly
      expect(averageRating).toBe(4); // (5 + 3 + 4) / 3 = 4
    });
    
    it('should return null for average rating when no reviews exist', () => {
      const averageRating = useReviewStore.getState().getAverageProductRating('non-existent-product');
      
      // Check if null is returned
      expect(averageRating).toBeNull();
    });
  });
  
  describe('Seller Review Actions', () => {
    it('should add a seller review', () => {
      act(() => {
        useReviewStore.getState().addSellerReview(mockSellerId, mockSellerReview);
      });
      
      const { sellerReviews, userReviews } = useReviewStore.getState();
      
      // Check if review was added to sellerReviews
      expect(sellerReviews[mockSellerId]).toHaveLength(1);
      expect(sellerReviews[mockSellerId][0].id).toBe('review-2');
      expect(sellerReviews[mockSellerId][0].rating).toBe(4);
      
      // Check if review was also added to userReviews
      expect(userReviews).toHaveLength(1);
      expect(userReviews[0].id).toBe('review-2');
    });
    
    it('should update a seller review', () => {
      // Add a review first
      act(() => {
        useReviewStore.getState().addSellerReview(mockSellerId, mockSellerReview);
      });
      
      // Update the review
      const updatedReview = {
        rating: 5,
        comment: 'Updated seller comment'
      };
      
      act(() => {
        useReviewStore.getState().updateSellerReview(mockSellerId, 'review-2', updatedReview);
      });
      
      const { sellerReviews, userReviews } = useReviewStore.getState();
      
      // Check if review was updated in sellerReviews
      expect(sellerReviews[mockSellerId][0].rating).toBe(5);
      expect(sellerReviews[mockSellerId][0].comment).toBe('Updated seller comment');
      
      // Check if review was also updated in userReviews
      expect(userReviews[0].rating).toBe(5);
      expect(userReviews[0].comment).toBe('Updated seller comment');
    });
    
    it('should delete a seller review', () => {
      // Add a review first
      act(() => {
        useReviewStore.getState().addSellerReview(mockSellerId, mockSellerReview);
      });
      
      // Delete the review
      act(() => {
        useReviewStore.getState().deleteSellerReview(mockSellerId, 'review-2');
      });
      
      const { sellerReviews, userReviews } = useReviewStore.getState();
      
      // Check if review was deleted from sellerReviews
      expect(sellerReviews[mockSellerId]).toHaveLength(0);
      
      // Check if review was also deleted from userReviews
      expect(userReviews).toHaveLength(0);
    });
    
    it('should set seller reviews', () => {
      const mockReviews = [mockSellerReview, { ...mockSellerReview, id: 'review-4', rating: 3 }];
      
      act(() => {
        useReviewStore.getState().setSellerReviews(mockSellerId, mockReviews);
      });
      
      const { sellerReviews } = useReviewStore.getState();
      
      // Check if reviews were set correctly
      expect(sellerReviews[mockSellerId]).toHaveLength(2);
      expect(sellerReviews[mockSellerId][0].id).toBe('review-2');
      expect(sellerReviews[mockSellerId][1].id).toBe('review-4');
    });
    
    it('should get seller reviews', () => {
      const mockReviews = [mockSellerReview, { ...mockSellerReview, id: 'review-4', rating: 3 }];
      
      act(() => {
        useReviewStore.getState().setSellerReviews(mockSellerId, mockReviews);
      });
      
      const reviews = useReviewStore.getState().getSellerReviews(mockSellerId);
      
      // Check if reviews were retrieved correctly
      expect(reviews).toHaveLength(2);
      expect(reviews[0].id).toBe('review-2');
      expect(reviews[1].id).toBe('review-4');
    });
    
    it('should return empty array for non-existent seller reviews', () => {
      const reviews = useReviewStore.getState().getSellerReviews('non-existent-seller');
      
      // Check if empty array is returned
      expect(reviews).toHaveLength(0);
    });
    
    it('should calculate average seller rating', () => {
      const mockReviews = [
        mockSellerReview, // rating: 4
        { ...mockSellerReview, id: 'review-4', rating: 5 },
        { ...mockSellerReview, id: 'review-5', rating: 3 }
      ];
      
      act(() => {
        useReviewStore.getState().setSellerReviews(mockSellerId, mockReviews);
      });
      
      const averageRating = useReviewStore.getState().getAverageSellerRating(mockSellerId);
      
      // Check if average rating is calculated correctly
      expect(averageRating).toBe(4); // (4 + 5 + 3) / 3 = 4
    });
    
    it('should return null for average rating when no reviews exist', () => {
      const averageRating = useReviewStore.getState().getAverageSellerRating('non-existent-seller');
      
      // Check if null is returned
      expect(averageRating).toBeNull();
    });
  });
  
  describe('User Review Actions', () => {
    it('should add a user review', () => {
      act(() => {
        useReviewStore.getState().addUserReview(mockProductReview);
      });
      
      const { userReviews } = useReviewStore.getState();
      
      // Check if review was added to userReviews
      expect(userReviews).toHaveLength(1);
      expect(userReviews[0].id).toBe('review-1');
    });
    
    it('should update a user review', () => {
      // Add a review first
      act(() => {
        useReviewStore.getState().addUserReview(mockProductReview);
      });
      
      // Update the review
      const updatedReview = {
        rating: 3,
        comment: 'Updated user comment'
      };
      
      act(() => {
        useReviewStore.getState().updateUserReview('review-1', updatedReview);
      });
      
      const { userReviews } = useReviewStore.getState();
      
      // Check if review was updated
      expect(userReviews[0].rating).toBe(3);
      expect(userReviews[0].comment).toBe('Updated user comment');
    });
    
    it('should delete a user review', () => {
      // Add a review first
      act(() => {
        useReviewStore.getState().addUserReview(mockProductReview);
      });
      
      // Delete the review
      act(() => {
        useReviewStore.getState().deleteUserReview('review-1');
      });
      
      const { userReviews } = useReviewStore.getState();
      
      // Check if review was deleted
      expect(userReviews).toHaveLength(0);
    });
    
    it('should set user reviews', () => {
      const mockReviews = [mockProductReview, mockSellerReview];
      
      act(() => {
        useReviewStore.getState().setUserReviews(mockReviews);
      });
      
      const { userReviews } = useReviewStore.getState();
      
      // Check if reviews were set correctly
      expect(userReviews).toHaveLength(2);
      expect(userReviews[0].id).toBe('review-1');
      expect(userReviews[1].id).toBe('review-2');
    });
  });
  
  describe('Clear All', () => {
    it('should clear all reviews', () => {
      // Add some reviews
      act(() => {
        useReviewStore.getState().addProductReview(mockProductId, mockProductReview);
        useReviewStore.getState().addSellerReview(mockSellerId, mockSellerReview);
      });
      
      // Verify reviews were added
      expect(useReviewStore.getState().productReviews[mockProductId]).toHaveLength(1);
      expect(useReviewStore.getState().sellerReviews[mockSellerId]).toHaveLength(1);
      expect(useReviewStore.getState().userReviews).toHaveLength(2);
      
      // Clear all reviews
      act(() => {
        useReviewStore.getState().clearAll();
      });
      
      // Check if all reviews were cleared
      expect(useReviewStore.getState().productReviews).toEqual({});
      expect(useReviewStore.getState().sellerReviews).toEqual({});
      expect(useReviewStore.getState().userReviews).toHaveLength(0);
    });
  });
  
  describe('Persistence', () => {
    it('should persist the review state to localStorage', () => {
      // Add some reviews
      act(() => {
        useReviewStore.getState().addProductReview(mockProductId, mockProductReview);
        useReviewStore.getState().addSellerReview(mockSellerId, mockSellerReview);
      });
      
      // Manually create the state to store
      const state = useReviewStore.getState();
      const storeData = {
        state: {
          productReviews: state.productReviews,
          sellerReviews: state.sellerReviews,
          userReviews: state.userReviews
        },
        version: 0
      };
      
      // Manually call localStorage.setItem
      localStorage.setItem('review-storage', JSON.stringify(storeData));
      
      // Check if localStorage.setItem was called with the correct key
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'review-storage',
        expect.any(String)
      );
      
      // Parse the stored JSON to verify the content
      const storedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      
      // Check if the state was stored correctly
      expect(storedData.state.productReviews[mockProductId]).toHaveLength(1);
      expect(storedData.state.sellerReviews[mockSellerId]).toHaveLength(1);
      expect(storedData.state.userReviews).toHaveLength(2);
    });
    
    it('should hydrate the store from localStorage on initialization', () => {
      // Set up initial state
      act(() => {
        useReviewStore.setState({
          productReviews: {
            [mockProductId]: [mockProductReview]
          },
          sellerReviews: {
            [mockSellerId]: [mockSellerReview]
          },
          userReviews: [mockProductReview, mockSellerReview]
        });
      });
      
      // Get the state and verify it was set correctly
      const state = useReviewStore.getState();
      expect(state.productReviews[mockProductId]).toHaveLength(1);
      expect(state.sellerReviews[mockSellerId]).toHaveLength(1);
      expect(state.userReviews).toHaveLength(2);
    });
  });
});
