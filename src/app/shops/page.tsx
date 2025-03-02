import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';

export default async function ShopsPage() {
  // Fetch all approved sellers
  let sellers = [];
  
  try {
    sellers = await prisma.user.findMany({
      where: {
        isSeller: true,
        sellerApproved: true,
      },
      select: {
        id: true,
        name: true,
        shopName: true,
        shopDescription: true,
        sellerLogo: true,
        sellerRating: true,
        sellerRatingsCount: true,
        sellerSince: true,
        products: {
          where: {
            sellerId: {
              not: null,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    // Return empty array if there's an error (e.g., schema not updated yet)
    sellers = [];
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Shops</h1>
      
      {sellers.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-3">No Shops Available</h2>
          <p className="text-gray-600 mb-6">
            There are no shops available at the moment. Check back soon!
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => {
            // Format seller since date
            const sellerSinceFormatted = seller.sellerSince
              ? formatDistanceToNow(new Date(seller.sellerSince), { addSuffix: true })
              : 'Recently';
              
            return (
              <Link 
                key={seller.id} 
                href={`/shop/${seller.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                      <Image
                        src={seller.sellerLogo || 'https://via.placeholder.com/200x200?text=Shop+Logo'}
                        alt={`${seller.shopName || seller.name}'s logo`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{seller.shopName || seller.name}</h2>
                      <p className="text-sm text-gray-500">Seller {sellerSinceFormatted}</p>
                      
                      {seller.sellerRating && (
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(seller.sellerRating || 0)
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
                          <span className="ml-1 text-xs text-gray-600">
                            {seller.sellerRating.toFixed(1)} ({seller.sellerRatingsCount})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {seller.shopDescription || 'No shop description available.'}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {seller.products.length} {seller.products.length === 1 ? 'product' : 'products'}
                    </span>
                    <span className="text-primary-600 text-sm font-medium">View Shop →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
