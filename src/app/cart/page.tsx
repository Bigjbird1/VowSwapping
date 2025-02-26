'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/auth/signin?callbackUrl=/cart');
      return;
    }
    
    router.push('/checkout');
  };

  if (!mounted) {
    return <div className="container py-8">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-3 rounded-md font-medium hover:bg-primary-700 transition-colors mb-3"
            >
              Proceed to Checkout
            </button>
            
            <button
              onClick={() => clearCart()}
              className="w-full text-gray-600 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  updateQuantity,
  removeItem,
}: {
  item: CartItem;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}) {
  return (
    <div className="p-4 flex items-start">
      <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src={item.image}
          alt={item.title}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      
      <div className="ml-4 flex-grow">
        <Link href={`/products/${item.id}`} className="font-medium text-gray-900 hover:text-primary-600">
          {item.title}
        </Link>
        
        <div className="mt-1 flex justify-between">
          <div>
            <span className="text-gray-600">
              {item.discountPrice ? (
                <>
                  <span className="font-medium">${item.discountPrice.toFixed(2)}</span>
                  <span className="ml-2 text-sm line-through">${item.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="font-medium">${item.price.toFixed(2)}</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              -
            </button>
            <span className="mx-2">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex justify-between">
          <span className="text-gray-600">
            Subtotal: ${((item.discountPrice || item.price) * item.quantity).toFixed(2)}
          </span>
          
          <button
            onClick={() => removeItem(item.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
