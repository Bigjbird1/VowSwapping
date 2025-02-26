'use client'

import { Product } from '@/types/product'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

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
          <div className="relative h-64 w-full">
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
        <div className="mt-1 flex items-center">
          {discountPrice ? (
            <>
              <p className="text-sm font-medium text-gray-900">{formattedDiscountPrice}</p>
              <p className="ml-2 text-sm text-gray-500 line-through">{formattedPrice}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-gray-900">{formattedPrice}</p>
          )}
        </div>
      </div>
    </div>
  )
}
