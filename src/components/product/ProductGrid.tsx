import { Product } from '@/types/product'
import ProductCard from './ProductCard'
import Pagination from './Pagination'

interface ProductGridProps {
  products: Product[]
  columns?: 2 | 3 | 4
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export default function ProductGrid({ 
  products = [], 
  columns = 3,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {}
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns]
  
  return (
    <>
      <div className={`grid ${gridCols} gap-x-6 gap-y-10`}>
        {products && products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        
        {/* Empty state */}
        {products.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {products.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  )
}
