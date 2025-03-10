'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  mergeWithUserCart: (userCart: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.id === item.id);
        
        let newItems;
        if (existingItem) {
          // Update quantity if item already exists
          newItems = items.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          // Add new item
          newItems = [...items, item];
        }
        
        // Calculate new totals
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => {
          const price = item.discountPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
        
        set({ items: newItems, totalItems, totalPrice });
      },
      
      removeItem: (id) => {
        const { items } = get();
        const newItems = items.filter(item => item.id !== id);
        
        // Calculate new totals
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => {
          const price = item.discountPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
        
        set({ items: newItems, totalItems, totalPrice });
      },
      
      updateQuantity: (id, quantity) => {
        const { items } = get();
        let newItems;
        
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          newItems = items.filter(item => item.id !== id);
        } else {
          newItems = items.map(item => 
            item.id === id ? { ...item, quantity } : item
          );
        }
        
        // Calculate new totals
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => {
          const price = item.discountPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
        
        set({ items: newItems, totalItems, totalPrice });
      },
      
      updateItem: (id, updates) => {
        const { items } = get();
        const newItems = items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        );
        
        // Calculate new totals
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => {
          const price = item.discountPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
        
        set({ items: newItems, totalItems, totalPrice });
      },
      
      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
      
      mergeWithUserCart: (userCart) => {
        const { items } = get();
        
        // Create a map of existing items by ID
        const itemMap = new Map();
        items.forEach(item => {
          itemMap.set(item.id, item);
        });
        
        // Merge with user cart
        userCart.forEach(userItem => {
          const existingItem = itemMap.get(userItem.id);
          if (existingItem) {
            // Update quantity if item exists in both carts
            itemMap.set(userItem.id, {
              ...userItem,
              quantity: existingItem.quantity + userItem.quantity
            });
          } else {
            // Add new item from user cart
            itemMap.set(userItem.id, userItem);
          }
        });
        
        // Convert map back to array
        const newItems = Array.from(itemMap.values());
        
        // Calculate new totals
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => {
          const price = item.discountPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
        
        set({ items: newItems, totalItems, totalPrice });
      }
    }),
    {
      name: 'vowswap-cart', // localStorage key
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
