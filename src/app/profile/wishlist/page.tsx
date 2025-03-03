'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore, WishlistItem } from '@/store/wishlistStore';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration errors
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="mb-4">Please sign in to view your wishlist.</p>
          <Link 
            href="/auth/signin" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleMoveToCart = (item: WishlistItem) => {
    // Create a complete Product object from the wishlist item
    const product = {
      id: item.product.id,
      title: item.product.title,
      description: '', // Add empty description as it's required
      price: item.product.price,
      discountPrice: item.product.discountPrice,
      images: item.product.images,
      category: item.product.category as any, // Cast to any as we store it as string in wishlist
      condition: item.product.condition as any, // Cast to any as we store it as string in wishlist
      tags: [], // Empty tags array as it's required
      createdAt: new Date().toISOString(), // Current date as string
      updatedAt: new Date().toISOString(), // Current date as string
      seller: item.product.seller,
    };
    
    addItem(product, 1);
    removeFromWishlist(item.productId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        {items.length > 0 && (
          <button
            onClick={() => clearWishlist()}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
          <Link
            href="/products"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48 w-full">
                <Link href={`/products/${item.product.id}`}>
                  <Image
                    src={item.product.images[0] || '/placeholder.jpg'}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                </Link>
              </div>
              <div className="p-4">
                <Link href={`/products/${item.product.id}`}>
                  <h2 className="text-lg font-semibold mb-2 hover:text-blue-600">
                    {item.product.title}
                  </h2>
                </Link>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    {item.product.discountPrice ? (
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-blue-600">
                          ${item.product.discountPrice.toFixed(2)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ${item.product.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold">
                        ${item.product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.product.condition}
                  </div>
                </div>
                {item.product.seller && (
                  <div className="text-sm text-gray-600 mb-3">
                    Seller: {item.product.seller.shopName || item.product.seller.name}
                  </div>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="flex items-center text-red-600 hover:text-red-800"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={16} className="mr-1" />
                    <span>Remove</span>
                  </button>
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex items-center bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    aria-label="Move to cart"
                  >
                    <ShoppingCart size={16} className="mr-1" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
