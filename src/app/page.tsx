import Link from 'next/link'
import Image from 'next/image'
import ProductGrid from '@/components/product/ProductGrid'
import { getFeaturedProducts } from '@/lib/products'

export default async function Home() {
  const featuredProducts = await getFeaturedProducts()
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary-50">
        <div className="container py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Find Your Perfect Wedding Items
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Discover pre-loved wedding dresses, accessories, and decorations at a fraction of the retail price.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/products" 
                  className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors text-center"
                >
                  Shop Now
                </Link>
                <Link 
                  href="/about" 
                  className="bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden" style={{ position: 'relative', height: '24rem' }}>
              <Image
                src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                alt="Wedding dress"
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Dresses',
                image: 'https://images.unsplash.com/photo-1594552072238-5c4a26f10bfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
                href: '/products/category/dresses'
              },
              {
                title: 'Accessories',
                image: 'https://images.unsplash.com/photo-1546167889-0b4b5ff0aec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
                href: '/products/category/accessories'
              },
              {
                title: 'Decorations',
                image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                href: '/products/category/decorations'
              }
            ].map((category, index) => (
              <Link 
                key={index} 
                href={category.href}
                className="group relative h-64 rounded-lg overflow-hidden"
                style={{ position: 'relative', height: '16rem' }}
              >
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <h3 className="text-white text-2xl font-bold">{category.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link 
              href="/products" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "I found my dream dress at half the retail price. It was in perfect condition and saved me so much money!",
                author: "Sarah T.",
                role: "Bride"
              },
              {
                quote: "After my wedding, I was able to sell my decorations quickly. It's great to know they're being reused for another special day.",
                author: "Michael R.",
                role: "Seller"
              },
              {
                quote: "The accessories I found were unique and beautiful. I received so many compliments on my wedding day.",
                author: "Jessica L.",
                role: "Bride"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-primary-500 mb-4">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Wedding Items?</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of couples who have found beautiful, affordable items for their special day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/products" 
              className="bg-white text-primary-600 px-8 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors inline-block"
            >
              Shop Now
            </Link>
            <Link 
              href="/seller/register" 
              className="bg-primary-700 text-white border border-white px-8 py-3 rounded-md font-medium hover:bg-primary-800 transition-colors inline-block"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
      
      {/* Seller Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden" style={{ position: 'relative', height: '24rem' }}>
              <Image
                src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                alt="Seller with wedding items"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Sell Your Wedding Items</h2>
              <p className="text-gray-600 mb-6">
                Have wedding items you no longer need? Join our marketplace and turn them into cash while helping other couples create their perfect day.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-primary-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create your seller profile in minutes</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-primary-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>List your items with our easy-to-use tools</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-primary-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reach thousands of engaged couples</span>
                </li>
              </ul>
              <Link 
                href="/seller/register" 
                className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors inline-block"
              >
                Start Selling Today
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
