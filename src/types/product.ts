export type ProductCategory = 'dresses' | 'accessories' | 'decorations' | 'other';

export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: ProductCategory;
  condition: ProductCondition;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export interface ProductFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  searchQuery?: string;
}
