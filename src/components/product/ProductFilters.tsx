'use client'

import { ProductCategory, ProductCondition } from '@/types/product'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

interface ProductFiltersProps {
  selectedCategory?: string
  selectedMinPrice?: number
  selectedMaxPrice?: number
  selectedCondition?: ProductCondition
  searchQuery?: string
}

export default function ProductFilters({
  selectedCategory,
  selectedMinPrice,
  selectedMaxPrice,
  selectedCondition,
  searchQuery,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Local state for form values
  const [category, setCategory] = useState<string | undefined>(selectedCategory)
  const [minPrice, setMinPrice] = useState<number | undefined>(selectedMinPrice)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(selectedMaxPrice)
  const [condition, setCondition] = useState<ProductCondition | undefined>(selectedCondition)
  const [query, setQuery] = useState<string | undefined>(searchQuery)
  
  // Categories
  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'dresses', label: 'Dresses' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'decorations', label: 'Decorations' },
    { value: 'other', label: 'Other' },
  ]
  
  // Conditions
  const conditions: { value: ProductCondition; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ]
  
  // Price ranges
  const priceRanges = [
    { min: undefined, max: 100, label: 'Under $100' },
    { min: 100, max: 500, label: '$100 - $500' },
    { min: 500, max: 1000, label: '$500 - $1,000' },
    { min: 1000, max: undefined, label: 'Over $1,000' },
  ]
  
  // Apply filters
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()
    
    if (category) params.set('category', category)
    if (minPrice !== undefined) params.set('minPrice', minPrice.toString())
    if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString())
    if (condition) params.set('condition', condition)
    if (query) params.set('q', query)
    
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, category, minPrice, maxPrice, condition, query])
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setCategory(undefined)
    setMinPrice(undefined)
    setMaxPrice(undefined)
    setCondition(undefined)
    setQuery(undefined)
    router.push(pathname)
  }, [router, pathname])
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        
        {/* Search */}
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Search products..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={query || ''}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Categories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.value} className="flex items-center">
                <input
                  id={`category-${cat.value}`}
                  name="category"
                  type="radio"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  checked={category === cat.value}
                  onChange={() => setCategory(cat.value)}
                />
                <label
                  htmlFor={`category-${cat.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {cat.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Price Range */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Price Range</h4>
          <div className="space-y-2">
            {priceRanges.map((range, index) => (
              <div key={index} className="flex items-center">
                <input
                  id={`price-${index}`}
                  name="price"
                  type="radio"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  checked={minPrice === range.min && maxPrice === range.max}
                  onChange={() => {
                    setMinPrice(range.min)
                    setMaxPrice(range.max)
                  }}
                />
                <label
                  htmlFor={`price-${index}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {range.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Condition */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Condition</h4>
          <div className="space-y-2">
            {conditions.map((cond) => (
              <div key={cond.value} className="flex items-center">
                <input
                  id={`condition-${cond.value}`}
                  name="condition"
                  type="radio"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  checked={condition === cond.value}
                  onChange={() => setCondition(cond.value)}
                />
                <label
                  htmlFor={`condition-${cond.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {cond.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={applyFilters}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="flex-1 bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
