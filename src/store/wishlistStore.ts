import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WishlistItem = {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    discountPrice?: number;
    images: string[];
    category: string;
    condition: string;
    seller?: {
      id: string;
      name: string;
      shopName: string;
      sellerRating: number;
    };
  };
};

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  addToWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addToWishlist: (product) => {
        const { items } = get();
        const isAlreadyInWishlist = items.some(item => item.productId === product.id);
        
        if (!isAlreadyInWishlist) {
          const newItem: WishlistItem = {
            id: `wishlist-${Date.now()}`,
            productId: product.id,
            product: {
              id: product.id,
              title: product.title,
              price: product.price,
              discountPrice: product.discountPrice,
              images: product.images,
              category: product.category,
              condition: product.condition,
              seller: product.seller ? {
                id: product.seller.id,
                name: product.seller.name,
                shopName: product.seller.shopName,
                sellerRating: product.seller.sellerRating || 0,
              } : undefined,
            },
          };
          
          set({ items: [...items, newItem] });
        }
      },

      removeFromWishlist: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.productId !== productId) });
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
