import { getProductsByCategory } from '@/lib/products'
import ProductGrid from '@/components/product/ProductGrid'
import Link from 'next/link'
import { Metadata } from 'next'
import { ProductCategory } from '@/types/product'

type Params = {
  category: ProductCategory
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1)
  
  return {
    title: `${categoryName} | VowSwap`,
    description: `Browse our collection of pre-loved wedding ${params.category}`,
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const products = await getProductsByCategory(params.category)
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1)
  
  return (
    <div className="container py-8">
      <div className="mb-4">
        <Link href="/products" className="text-primary-600 hover:text-primary-700">
          ← Back to All Products
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">{categoryName}</h1>
      
      <ProductGrid products={products} />
    </div>
  )
}
