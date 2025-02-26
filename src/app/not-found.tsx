import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors inline-block"
      >
        Return to Home
      </Link>
    </div>
  )
}
