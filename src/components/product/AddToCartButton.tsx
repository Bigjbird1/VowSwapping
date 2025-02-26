'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import { useCartStore } from '@/store/cartStore';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product, quantity);
    
    // Show feedback for a short time
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <div className="flex-1">
      <div className="flex items-center mb-3">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="bg-gray-100 text-gray-600 px-3 py-1 rounded-l-md"
        >
          -
        </button>
        <span className="bg-gray-100 text-gray-800 px-4 py-1">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="bg-gray-100 text-gray-600 px-3 py-1 rounded-r-md"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`w-full bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors flex items-center justify-center ${
          isAdding ? 'opacity-75' : ''
        }`}
      >
        {isAdding ? 'Added!' : 'Add to Cart'}
      </button>
    </div>
  );
}
