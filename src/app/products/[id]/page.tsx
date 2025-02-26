import { getProductById, getRelatedProducts } from '@/lib/products'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductGrid from '@/components/product/ProductGrid'
import Link from 'next/link'
import { Metadata } from 'next'

interface ProductPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductById(params.id)
  
  if (!product) {
    return {
      title: 'Product Not Found | VowSwap',
    }
  }
  
  return {
    title: `${product.title} | VowSwap`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(params.id)
  
  if (!product) {
    notFound()
  }
  
  const relatedProducts = await getRelatedProducts(params.id)
  
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price)
  
  const formattedDiscountPrice = product.discountPrice
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(product.discountPrice)
    : null
  
  const conditionLabel = {
    'new': 'New',
    'like-new': 'Like New',
    'good': 'Good',
    'fair': 'Fair',
  }[product.condition]
  
  return (
    <div className="container py-8">
      <div className="mb-4">
        <Link href="/products" className="text-primary-600 hover:text-primary-700">
          ← Back to Products
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Product Images */}
        <div>
          <div className="relative h-96 w-full mb-4 rounded-lg overflow-hidden">
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <div key={index} className="relative h-24 rounded-md overflow-hidden">
                  <Image
                    src={image}
                    alt={`${product.title} - Image ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
          
          <div className="flex items-center mb-4">
            <span className="text-gray-600 capitalize mr-4">{product.category}</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 text-sm rounded-md">
              {conditionLabel}
            </span>
          </div>
          
          <div className="mb-6">
            {product.discountPrice ? (
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900 mr-2">
                  {formattedDiscountPrice}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  {formattedPrice}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900">{formattedPrice}</span>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Description</h2>
            <p className="text-gray-600">{product.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors flex-1">
              Add to Cart
            </button>
            <button className="bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  )
}
