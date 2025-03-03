import { getProducts } from '@/lib/products'
import ProductGrid from '@/components/product/ProductGrid'
import ProductFilters from '@/components/product/ProductFilters'
import { Metadata } from 'next'
import { ProductCategory, ProductCondition } from '@/types/product'

export const metadata: Metadata = {
  title: 'All Products | VowSwap',
  description: 'Browse our collection of pre-loved wedding items',
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Handle search params directly without destructuring
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) : undefined;
  const condition = typeof searchParams.condition === 'string' ? searchParams.condition : undefined;
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  
  // Fetch products with filters
  const products = await getProducts({
    category: category as ProductCategory | undefined,
    minPrice,
    maxPrice,
    condition: condition as ProductCondition | undefined,
    searchQuery,
  });
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="lg:col-span-1">
          <ProductFilters 
            selectedCategory={category}
            selectedMinPrice={minPrice}
            selectedMaxPrice={maxPrice}
            selectedCondition={condition as ProductCondition | undefined}
            searchQuery={searchQuery}
          />
        </div>
        
        {/* Products */}
        <div className="lg:col-span-3">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  )
}
