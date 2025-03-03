'use client'

import { Product } from '@/types/product'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import WishlistButton from './WishlistButton'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const { id, title, price, discountPrice, images, category, condition } = product
  const displayImage = images[0] || 'https://via.placeholder.com/300x400?text=No+Image'
  const hoverImage = images[1] || images[0] || 'https://via.placeholder.com/300x400?text=No+Image'
  
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
  
  const formattedDiscountPrice = discountPrice
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(discountPrice)
    : null
  
  const conditionLabel = {
    'new': 'New',
    'like-new': 'Like New',
    'good': 'Good',
    'fair': 'Fair',
  }[condition]
  
  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="aspect-h-4 aspect-w-3 overflow-hidden rounded-lg bg-gray-100">
        <Link href={`/products/${id}`}>
          <div className="relative h-64 w-full" style={{ position: 'relative', height: '16rem' }}>
            <Image
              src={isHovered && hoverImage !== displayImage ? hoverImage : displayImage}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              className="transition-opacity duration-300"
            />
            
            {/* Condition Badge */}
            <div className="absolute top-2 left-2 bg-white px-2 py-1 text-xs font-medium text-gray-700 rounded-md">
              {conditionLabel}
            </div>
            
            {/* Wishlist Button */}
            <div className="absolute top-2 right-2">
              <WishlistButton product={product} size="sm" />
            </div>
            
            {/* Quick View Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white bg-opacity-90 px-4 py-2 rounded-md font-medium text-primary-600 hover:text-primary-700">
                Quick View
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Product Info */}
      <div className="mt-4">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            <Link href={`/products/${id}`} className="hover:text-primary-600">
              {title}
            </Link>
          </h3>
          <p className="text-sm font-medium text-gray-500 capitalize">
            {category}
          </p>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div>
            {discountPrice ? (
              <>
                <p className="text-sm font-medium text-gray-900">{formattedDiscountPrice}</p>
                <p className="text-sm text-gray-500 line-through">{formattedPrice}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-gray-900">{formattedPrice}</p>
            )}
          </div>
          
          {/* Seller Info */}
          {product.seller && (
            <div className="text-xs text-gray-500">
              <Link 
                href={`/shop/${product.seller.id}`}
                className="hover:text-primary-600"
              >
                {product.seller.shopName || product.seller.name || 'Seller'}
              </Link>
              {product.seller.sellerRating !== undefined && (
                <div className="flex items-center mt-1">
                  <svg
                    className="h-3 w-3 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1">
                    {product.seller.sellerRating?.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
