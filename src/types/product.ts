export type ProductCategory = 'dresses' | 'accessories' | 'decorations' | 'other';

export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair';

export interface SellerInfo {
  id: string;
  name?: string;
  shopName?: string;
  sellerRating?: number;
  sellerRatingsCount?: number;
  sellerSince?: string;
  sellerLogo?: string;
}

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
  sellerId?: string;
  seller?: SellerInfo;
  approved?: boolean;
}

export interface ProductFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  searchQuery?: string;
  sellerId?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  productId?: string;
  sellerId?: string;
  reviewerId: string;
  reviewerName: string;
}
