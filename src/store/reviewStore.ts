import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  productId?: string;
  sellerId?: string;
  reviewerId: string;
  reviewerName: string;
  
  // Relations that may be included in API responses
  product?: {
    id: string;
    title: string;
    images: string[];
  };
  seller?: {
    id: string;
    name?: string;
    shopName?: string;
    image?: string;
  };
}

interface ReviewState {
  productReviews: Record<string, Review[]>; // productId -> reviews
  sellerReviews: Record<string, Review[]>; // sellerId -> reviews
  userReviews: Review[]; // reviews created by the current user
  
  // Product review actions
  addProductReview: (productId: string, review: Review) => void;
  updateProductReview: (productId: string, reviewId: string, review: Partial<Review>) => void;
  deleteProductReview: (productId: string, reviewId: string) => void;
  setProductReviews: (productId: string, reviews: Review[]) => void;
  
  // Seller review actions
  addSellerReview: (sellerId: string, review: Review) => void;
  updateSellerReview: (sellerId: string, reviewId: string, review: Partial<Review>) => void;
  deleteSellerReview: (sellerId: string, reviewId: string) => void;
  setSellerReviews: (sellerId: string, reviews: Review[]) => void;
  
  // User review actions
  addUserReview: (review: Review) => void;
  updateUserReview: (reviewId: string, review: Partial<Review>) => void;
  deleteUserReview: (reviewId: string) => void;
  setUserReviews: (reviews: Review[]) => void;
  
  // Utility functions
  getProductReviews: (productId: string) => Review[];
  getSellerReviews: (sellerId: string) => Review[];
  getAverageProductRating: (productId: string) => number | null;
  getAverageSellerRating: (sellerId: string) => number | null;
  clearAll: () => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      productReviews: {},
      sellerReviews: {},
      userReviews: [],
      
      // Product review actions
      addProductReview: (productId, review) => {
        set((state) => {
          const currentReviews = state.productReviews[productId] || [];
          return {
            productReviews: {
              ...state.productReviews,
              [productId]: [...currentReviews, review],
            },
            userReviews: [...state.userReviews, review],
          };
        });
      },
      
      updateProductReview: (productId, reviewId, updatedReview) => {
        set((state) => {
          const currentReviews = state.productReviews[productId] || [];
          const updatedReviews = currentReviews.map((review) =>
            review.id === reviewId ? { ...review, ...updatedReview } : review
          );
          
          const updatedUserReviews = state.userReviews.map((review) =>
            review.id === reviewId ? { ...review, ...updatedReview } : review
          );
          
          return {
            productReviews: {
              ...state.productReviews,
              [productId]: updatedReviews,
            },
            userReviews: updatedUserReviews,
          };
        });
      },
      
      deleteProductReview: (productId, reviewId) => {
        set((state) => {
          const currentReviews = state.productReviews[productId] || [];
          const filteredReviews = currentReviews.filter((review) => review.id !== reviewId);
          
          const filteredUserReviews = state.userReviews.filter((review) => review.id !== reviewId);
          
          return {
            productReviews: {
              ...state.productReviews,
              [productId]: filteredReviews,
            },
            userReviews: filteredUserReviews,
          };
        });
      },
      
      setProductReviews: (productId, reviews) => {
        set((state) => ({
          productReviews: {
            ...state.productReviews,
            [productId]: reviews || [],
          },
        }));
      },
      
      // Seller review actions
      addSellerReview: (sellerId, review) => {
        set((state) => {
          const currentReviews = state.sellerReviews[sellerId] || [];
          return {
            sellerReviews: {
              ...state.sellerReviews,
              [sellerId]: [...currentReviews, review],
            },
            userReviews: [...state.userReviews, review],
          };
        });
      },
      
      updateSellerReview: (sellerId, reviewId, updatedReview) => {
        set((state) => {
          const currentReviews = state.sellerReviews[sellerId] || [];
          const updatedReviews = currentReviews.map((review) =>
            review.id === reviewId ? { ...review, ...updatedReview } : review
          );
          
          const updatedUserReviews = state.userReviews.map((review) =>
            review.id === reviewId ? { ...review, ...updatedReview } : review
          );
          
          return {
            sellerReviews: {
              ...state.sellerReviews,
              [sellerId]: updatedReviews,
            },
            userReviews: updatedUserReviews,
          };
        });
      },
      
      deleteSellerReview: (sellerId, reviewId) => {
        set((state) => {
          const currentReviews = state.sellerReviews[sellerId] || [];
          const filteredReviews = currentReviews.filter((review) => review.id !== reviewId);
          
          const filteredUserReviews = state.userReviews.filter((review) => review.id !== reviewId);
          
          return {
            sellerReviews: {
              ...state.sellerReviews,
              [sellerId]: filteredReviews,
            },
            userReviews: filteredUserReviews,
          };
        });
      },
      
      setSellerReviews: (sellerId, reviews) => {
        set((state) => ({
          sellerReviews: {
            ...state.sellerReviews,
            [sellerId]: reviews || [],
          },
        }));
      },
      
      // User review actions
      addUserReview: (review) => {
        set((state) => ({
          userReviews: [...state.userReviews, review],
        }));
      },
      
      updateUserReview: (reviewId, updatedReview) => {
        set((state) => ({
          userReviews: state.userReviews.map((review) =>
            review.id === reviewId ? { ...review, ...updatedReview } : review
          ),
        }));
      },
      
      deleteUserReview: (reviewId) => {
        set((state) => ({
          userReviews: state.userReviews.filter((review) => review.id !== reviewId),
        }));
      },
      
      setUserReviews: (reviews) => {
        set(() => ({
          userReviews: reviews || [],
        }));
      },
      
      // Utility functions
      getProductReviews: (productId) => {
        return get().productReviews[productId] || [];
      },
      
      getSellerReviews: (sellerId) => {
        return get().sellerReviews[sellerId] || [];
      },
      
      getAverageProductRating: (productId) => {
        const reviews = get().productReviews[productId] || [];
        if (reviews.length === 0) return null;
        
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
      },
      
      getAverageSellerRating: (sellerId) => {
        const reviews = get().sellerReviews[sellerId] || [];
        if (reviews.length === 0) return null;
        
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
      },
      
      clearAll: () => {
        set({
          productReviews: {},
          sellerReviews: {},
          userReviews: [],
        });
      },
    }),
    {
      name: 'review-storage',
      storage: createJSONStorage(() => {
        // Check if window is defined (browser environment)
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a mock storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
