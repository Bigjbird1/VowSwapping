import Link from 'next/link';

export default function ShopNotFound() {
  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Shop Not Found</h1>
          
          <p className="text-gray-600 mb-6">
            The shop you're looking for doesn't exist or may have been removed.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/"
              className="inline-block bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Return to Homepage
            </Link>
            
            <Link
              href="/products"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
