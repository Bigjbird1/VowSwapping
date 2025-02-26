import { Product, ProductCategory, ProductFilters } from '@/types/product';

// Mock data for products
const products: Product[] = [
  {
    id: '1',
    title: 'Elegant Lace Wedding Dress',
    description: 'A beautiful lace wedding dress with a sweetheart neckline and chapel train. Perfect for a traditional wedding.',
    price: 1200,
    discountPrice: 899,
    images: [
      'https://images.unsplash.com/photo-1594552072238-5c4a26f10bfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      'https://images.unsplash.com/photo-1596451190630-186aff535bf2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'dresses',
    condition: 'like-new',
    tags: ['lace', 'white', 'sweetheart', 'chapel train'],
    createdAt: '2023-01-15T12:00:00Z',
    updatedAt: '2023-01-15T12:00:00Z',
    featured: true,
  },
  {
    id: '2',
    title: 'Crystal Bridal Tiara',
    description: 'Stunning crystal tiara that will make you feel like royalty on your special day.',
    price: 250,
    images: [
      'https://images.unsplash.com/photo-1546167889-0b4b5ff0aec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'accessories',
    condition: 'new',
    tags: ['tiara', 'crystal', 'silver'],
    createdAt: '2023-02-10T14:30:00Z',
    updatedAt: '2023-02-10T14:30:00Z',
    featured: true,
  },
  {
    id: '3',
    title: 'Rustic Wedding Centerpieces (Set of 10)',
    description: 'Beautiful rustic centerpieces featuring mason jars, burlap, and artificial flowers. Perfect for a country or barn wedding.',
    price: 350,
    discountPrice: 299,
    images: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'decorations',
    condition: 'good',
    tags: ['rustic', 'centerpieces', 'mason jars', 'burlap'],
    createdAt: '2023-03-05T09:15:00Z',
    updatedAt: '2023-03-05T09:15:00Z',
    featured: true,
  },
  {
    id: '4',
    title: 'Mermaid Style Wedding Dress',
    description: 'Stunning mermaid style wedding dress with beaded details and a dramatic train.',
    price: 1500,
    discountPrice: 1200,
    images: [
      'https://images.unsplash.com/photo-1585241920473-b472eb9ffbae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'dresses',
    condition: 'like-new',
    tags: ['mermaid', 'beaded', 'train'],
    createdAt: '2023-01-20T10:45:00Z',
    updatedAt: '2023-01-20T10:45:00Z',
    featured: false,
  },
  {
    id: '5',
    title: 'Pearl Bridal Earrings',
    description: 'Elegant pearl drop earrings that add a touch of sophistication to your bridal look.',
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'accessories',
    condition: 'new',
    tags: ['earrings', 'pearl', 'elegant'],
    createdAt: '2023-02-15T16:20:00Z',
    updatedAt: '2023-02-15T16:20:00Z',
    featured: false,
  },
  {
    id: '6',
    title: 'String Lights (100ft)',
    description: 'Warm white string lights perfect for creating a magical atmosphere at your wedding reception.',
    price: 80,
    images: [
      'https://images.unsplash.com/photo-1547393947-1849a9bc22f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'decorations',
    condition: 'good',
    tags: ['lights', 'string lights', 'reception'],
    createdAt: '2023-03-10T11:30:00Z',
    updatedAt: '2023-03-10T11:30:00Z',
    featured: true,
  },
];

// Get all products
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  // In a real application, this would be a database query
  let filteredProducts = [...products];
  
  if (filters) {
    if (filters.category) {
      filteredProducts = filteredProducts.filter(product => product.category === filters.category);
    }
    
    if (filters.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => {
        const price = product.discountPrice || product.price;
        return price >= filters.minPrice!;
      });
    }
    
    if (filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => {
        const price = product.discountPrice || product.price;
        return price <= filters.maxPrice!;
      });
    }
    
    if (filters.condition) {
      filteredProducts = filteredProducts.filter(product => product.condition === filters.condition);
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.title.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
  }
  
  return filteredProducts;
}

// Get a single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  const product = products.find(p => p.id === id);
  return product || null;
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  return products.filter(product => product.featured);
}

// Get products by category
export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
  return products.filter(product => product.category === category);
}

// Get related products (products in the same category, excluding the current product)
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  const currentProduct = await getProductById(productId);
  
  if (!currentProduct) {
    return [];
  }
  
  const relatedProducts = products.filter(
    product => product.category === currentProduct.category && product.id !== currentProduct.id
  );
  
  return relatedProducts.slice(0, limit);
}
