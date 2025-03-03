'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemsCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity) => {
        const { items } = get();
        const existingItem = items.find(item => item.id === product.id);
        
        // Handle potentially malformed images array
        let imageArray = product.images;
        if (typeof imageArray === 'string') {
          try {
            // Try to parse if it's a JSON string
            imageArray = JSON.parse(imageArray);
          } catch (e) {
            // If parsing fails, use a default array
            console.error('Error parsing images:', e);
            imageArray = [];
          }
        }
        
        // Ensure imageArray is an array
        if (!Array.isArray(imageArray)) {
          imageArray = [];
        }
        
        // Use default image if none are available
        const defaultImage = 'https://via.placeholder.com/300x400?text=No+Image';
        const displayImage = imageArray[0] || defaultImage;
        
        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: items.map(item => 
              item.id === product.id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                id: product.id,
                title: product.title,
                price: product.price,
                discountPrice: product.discountPrice,
                image: displayImage,
                quantity
              }
            ]
          });
        }
      },
      
      removeItem: (id) => {
        const { items } = get();
        set({
          items: items.filter(item => item.id !== id)
        });
      },
      
      updateQuantity: (id, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          set({
            items: items.filter(item => item.id !== id)
          });
        } else {
          set({
            items: items.map(item => 
              item.id === id ? { ...item, quantity } : item
            )
          });
        }
      },
      
      clearCart: () => set({ items: [] }),
      
      getItemsCount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.discountPrice || item.price;
          return total + (price * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'vowswap-cart', // localStorage key
    }
  )
);
