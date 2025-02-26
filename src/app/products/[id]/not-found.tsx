import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div className="container py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
      <p className="text-gray-600 mb-8">
        Sorry, the product you are looking for does not exist or has been removed.
      </p>
      <Link
        href="/products"
        className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors inline-block"
      >
        Browse All Products
      </Link>
    </div>
  )
}
