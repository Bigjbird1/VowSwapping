import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductGrid from '@/components/product/ProductGrid';
import { optimizeImage } from '@/lib/cloudinary';
import { formatDistanceToNow } from 'date-fns';
import { Product, ProductCategory, ProductCondition } from '@/types/product';
import dynamic from 'next/dynamic';

// Import the SellerReviews component dynamically to avoid SSR issues
const SellerReviews = dynamic(() => import('@/components/review/SellerReviews'), {
  ssr: false,
});

interface ShopPageProps {
  params: {
    id: string;
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = params;
  
  try {
    // Fetch seller information
    const seller = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        // Include seller fields but handle if they don't exist yet
        ...(process.env.NODE_ENV === 'development' ? {
          shopName: true,
          shopDescription: true,
          sellerBio: true,
          sellerLogo: true,
          sellerBanner: true,
          sellerRating: true,
          sellerRatingsCount: true,
          sellerSince: true,
          sellerSocial: true,
        } : {}),
      },
    });

    if (!seller) {
      notFound();
    }

    // Parse social media links (safely)
    let socialLinks: Record<string, string> = {};
    try {
      if (seller.sellerSocial) {
        socialLinks = JSON.parse(seller.sellerSocial as string);
      }
    } catch (error) {
      console.error('Error parsing social links:', error);
    }

    // Fetch seller's products
    const products = await prisma.product.findMany({
      where: {
        sellerId: seller.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map database products to application products
    const mappedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      images: product.images,
      category: product.category.toLowerCase() as ProductCategory,
      condition: product.condition.toLowerCase().replace('_', '-') as ProductCondition,
      tags: product.tags,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      featured: product.featured,
      sellerId: product.sellerId,
      seller: {
        id: seller.id,
        name: seller.name,
        shopName: seller.shopName as string | undefined,
      },
    }));

    // Format seller since date
    const sellerSinceFormatted = seller.sellerSince
      ? formatDistanceToNow(new Date(seller.sellerSince as Date), { addSuffix: true })
      : 'Recently';

    return (
      <div className="container py-8">
        {/* Shop Banner */}
        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-8">
          <Image
            src={seller.sellerBanner as string || seller.image || 'https://via.placeholder.com/1200x400?text=Shop+Banner'}
            alt={`${seller.shopName || seller.name}'s shop banner`}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Seller Info Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                  <Image
                    src={seller.sellerLogo as string || seller.image || 'https://via.placeholder.com/200x200?text=Shop+Logo'}
                    alt={`${seller.shopName || seller.name}'s logo`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <h1 className="text-xl font-bold text-center">{seller.shopName || seller.name}</h1>
                
                {seller.sellerRating && (
                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(Number(seller.sellerRating) || 0)
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
                    <span className="ml-2 text-sm text-gray-600">
                      {Number(seller.sellerRating).toFixed(1)} ({seller.sellerRatingsCount})
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-1">Seller {sellerSinceFormatted}</p>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">About the Shop</h2>
                <p className="text-gray-600 text-sm">{seller.shopDescription || 'No shop description available.'}</p>
              </div>
              
              {seller.sellerBio && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">About the Seller</h2>
                  <p className="text-gray-600 text-sm">{seller.sellerBio}</p>
                </div>
              )}
              
              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Connect</h2>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </a>
                    )}
                    
                    {socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    
                    {socialLinks.facebook && (
                      <a
                        href={`https://facebook.com/${socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                      </a>
                    )}
                    
                    {socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Products Section */}
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold mb-6">Products from {seller.shopName || seller.name}</h2>
            
            {mappedProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <h3 className="text-xl font-semibold mb-3">No Products Available</h3>
                <p className="text-gray-600">
                  This seller doesn't have any products listed at the moment. Check back soon!
                </p>
              </div>
            ) : (
              <ProductGrid products={mappedProducts as Product[]} />
            )}
          </div>
        </div>
        
        {/* Seller Reviews */}
        <SellerReviews sellerId={id} />
      </div>
    );
  } catch (error) {
    console.error('Error loading shop page:', error);
    notFound();
  }
}
