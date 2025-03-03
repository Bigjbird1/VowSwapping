import { getProductById, getRelatedProducts } from '@/lib/products'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductGrid from '@/components/product/ProductGrid'
import Link from 'next/link'
import { Metadata } from 'next'
import AddToCartButton from '@/components/product/AddToCartButton'
import WishlistButton from '@/components/product/WishlistButton'
import { formatDistanceToNow } from 'date-fns'
import ProductReviewsWrapper from '@/components/review/ProductReviewsWrapper'

type Params = {
  id: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
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

export default async function ProductPage({ params }: { params: Params }) {
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
          <div className="relative h-96 w-full mb-4 rounded-lg overflow-hidden" style={{ position: 'relative', height: '24rem' }}>
            {(() => {
              // Ensure images is an array
              let imageArray = product.images;
              if (typeof imageArray === 'string') {
                try {
                  // Try to parse if it's a JSON string
                  imageArray = JSON.parse(imageArray);
                } catch (e) {
                  // If parsing fails, use a default array
                  console.error('Error parsing images:', e);
                  imageArray = [];
                }
              }
              
              // Ensure imageArray is an array
              if (!Array.isArray(imageArray)) {
                imageArray = [];
              }
              
              // Use default image if none are available
              const defaultImage = 'https://via.placeholder.com/300x400?text=No+Image';
              const displayImage = imageArray[0] || defaultImage;
              
              return (
                <Image
                  src={displayImage}
                  alt={product.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              );
            })()}
          </div>
          
          {/* Handle potentially malformed images array */}
          {(() => {
            // Ensure images is an array
            let imageArray = product.images;
            if (typeof imageArray === 'string') {
              try {
                // Try to parse if it's a JSON string
                imageArray = JSON.parse(imageArray);
              } catch (e) {
                // If parsing fails, use a default array
                console.error('Error parsing images:', e);
                imageArray = [];
              }
            }
            
            // Ensure imageArray is an array
            if (!Array.isArray(imageArray)) {
              imageArray = [];
            }
            
            return imageArray.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {imageArray.map((image, index) => (
                  <div key={index} className="relative h-24 rounded-md overflow-hidden" style={{ position: 'relative', height: '6rem' }}>
                    <Image
                      src={image}
                      alt={`${product.title} - Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            ) : null;
          })()}
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
              {(() => {
                // Ensure tags is an array
                let tagsArray = product.tags;
                if (typeof tagsArray === 'string') {
                  try {
                    // Try to parse if it's a JSON string
                    tagsArray = JSON.parse(tagsArray);
                  } catch (e) {
                    // If parsing fails, use a default array
                    console.error('Error parsing tags:', e);
                    tagsArray = [];
                  }
                }
                
                // Ensure tagsArray is an array
                if (!Array.isArray(tagsArray)) {
                  tagsArray = [];
                }
                
                return tagsArray.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ));
              })()}
            </div>
          </div>
          
          {/* Seller Information */}
          {product.seller && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium mb-3">Seller Information</h2>
              <div className="flex items-center">
                <div className="relative h-12 w-12 rounded-full overflow-hidden mr-3">
                  <Image
                    src={product.seller?.sellerLogo || '/vercel.svg'}
                    alt={product.seller?.shopName || product.seller?.name || 'Seller'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <Link 
                    href={`/shop/${product.seller.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {product.seller?.shopName || product.seller?.name || 'Seller'}
                  </Link>
                  
                  {product.seller?.sellerRating !== undefined && (
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.seller?.sellerRating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1 text-sm text-gray-600">
                        {product.seller.sellerRating?.toFixed(1)} 
                        {product.seller.sellerRatingsCount && (
                          <span>({product.seller.sellerRatingsCount})</span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {product.seller?.sellerSince && (
                    <p className="text-sm text-gray-500">
                      Seller {formatDistanceToNow(new Date(product.seller.sellerSince), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <AddToCartButton product={product} />
            <WishlistButton product={product} size="lg" showText={true} />
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
      
      {/* Product Reviews */}
      <ProductReviewsWrapper productId={params.id} />
    </div>
  )
}
