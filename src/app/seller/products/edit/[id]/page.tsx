'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCategory, ProductCondition } from '@/types/product';

// Form validation schema
const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive('Discount price must be positive').optional(),
  category: z.enum(['dresses', 'accessories', 'decorations', 'other'] as const),
  condition: z.enum(['new', 'like-new', 'good', 'fair'] as const),
  tags: z.string().optional(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [productData, setProductData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      price: undefined,
      discountPrice: undefined,
      category: 'dresses',
      condition: 'new',
      tags: '',
      images: [],
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/seller/products/edit/' + id);
      return;
    }

    // Check if user is a seller
    if (status === 'authenticated' && !session?.user?.isSeller) {
      router.push('/seller/register');
      return;
    }

    // Check if seller is approved
    if (status === 'authenticated' && !session?.user?.sellerApproved) {
      router.push('/seller/pending');
      return;
    }

    // Fetch product data
    if (status === 'authenticated') {
      fetchProduct();
    }
  }, [status, router, session, id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/seller/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      setProductData(data.product);
      
      // Set form values
      reset({
        title: data.product.title,
        description: data.product.description,
        price: data.product.price,
        discountPrice: data.product.discountPrice,
        category: data.product.category as ProductCategory,
        condition: data.product.condition as ProductCondition,
        tags: data.product.tags.join(', '),
        images: data.product.images,
      });
      
      setUploadedImages(data.product.images);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error('Image upload error:', error);
        throw error;
      }
    });
    
    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...uploadedImages, ...uploadedUrls];
      setUploadedImages(newImages);
      setValue('images', newImages);
    } catch (error) {
      setError('Failed to upload one or more images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    setValue('images', newImages);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    // Process tags
    const processedTags = data.tags
      ? data.tags.split(',').map(tag => tag.trim().toLowerCase())
      : [];
    
    try {
      const response = await fetch(`/api/seller/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tags: processedTags,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update product');
      }
      
      setSuccess('Product updated successfully! It will be reviewed by an admin before being listed.');
      
      // Redirect to seller products page after a delay
      setTimeout(() => {
        router.push('/seller/products');
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Product update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <Link
            href="/seller/products"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Products
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            </div>
            
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isSaving}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isSaving}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isSaving}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
            
            {/* Discount Price */}
            <div>
              <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Discount Price ($)
              </label>
              <input
                id="discountPrice"
                type="number"
                step="0.01"
                {...register('discountPrice', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isSaving}
              />
              {errors.discountPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.discountPrice.message}</p>
              )}
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isSaving}
              >
                <option value="dresses">Dresses</option>
                <option value="accessories">Accessories</option>
                <option value="decorations">Decorations</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            
            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                id="condition"
                {...register('condition')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isSaving}
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
              {errors.condition && (
                <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
              )}
            </div>
            
            {/* Tags */}
            <div className="md:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                {...register('tags')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="wedding, vintage, lace, etc."
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-gray-500">
                Add relevant tags to help buyers find your product
              </p>
            </div>
            
            {/* Images */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Product Images</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Images *
                </label>
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isSaving || isUploading}
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer inline-block py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Add More Images'}
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Upload at least one image. First image will be the main product image.
                </p>
                {errors.images && (
                  <p className="mt-1 text-sm text-red-600">{errors.images.message}</p>
                )}
              </div>
              
              {/* Image Preview */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="relative h-40 w-full rounded-md overflow-hidden">
                        <Image
                          src={image}
                          alt={`Product image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs py-1 text-center">
                          Main Image
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="md:col-span-2 border-t border-gray-200 pt-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <Link
                  href="/seller/products"
                  className="py-3 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Your product will be reviewed by an admin before being listed.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
