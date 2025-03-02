'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { optimizeImage } from '@/lib/cloudinary';

type ProductFormData = {
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  condition: string;
  tags: string;
  featured: boolean;
};

type Product = ProductFormData & {
  id: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export default function EditProduct({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      discountPrice: undefined,
      category: 'dresses',
      condition: 'new',
      tags: '',
      featured: false,
    }
  });

  // Fetch product data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/products');
      return;
    }

    if (status === 'authenticated' && params.id) {
      fetchProduct(params.id);
    }
  }, [status, params.id, router]);

  const fetchProduct = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      const productData = data.product;
      
      if (!productData) {
        throw new Error('Product not found');
      }
      
      setProduct(productData);
      setImages(productData.images || []);
      
      // Format tags for the form
      const tagsString = productData.tags ? productData.tags.join(', ') : '';
      
      // Reset form with product data
      reset({
        title: productData.title,
        description: productData.description,
        price: productData.price,
        discountPrice: productData.discountPrice,
        category: productData.category,
        condition: productData.condition,
        tags: tagsString,
        featured: productData.featured,
      });
      
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages = [...images];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await convertFileToBase64(file);
        
        // Update progress
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));
        
        // Upload to server
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            folder: 'products',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
        
        const data = await response.json();
        uploadedImages.push(data.url);
        
        // Update progress again
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      setImages(uploadedImages);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      setError('Please upload at least one product image');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Process tags
      const tags = data.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Update product
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tags,
          images,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Redirect to product list
      router.push('/admin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  if (!product) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          Product not found or you don't have permission to edit it.
        </div>
        <Link
          href="/admin/products"
          className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link
          href="/admin/products"
          className="inline-block bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
        >
          Back to Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title*
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price* ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' },
                    valueAsNumber: true,
                  })}
                  className={`w-full p-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('discountPrice', { 
                    min: { value: 0, message: 'Discount price must be positive' },
                    valueAsNumber: true,
                  })}
                  className={`w-full p-2 border rounded-md ${errors.discountPrice ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.discountPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.discountPrice.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className={`w-full p-2 border rounded-md ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition*
                </label>
                <select
                  {...register('condition', { required: 'Condition is required' })}
                  className={`w-full p-2 border rounded-md ${errors.condition ? 'border-red-500' : 'border-gray-300'}`}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="wedding, white, lace, etc."
                  {...register('tags')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <Controller
                  name="featured"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id="featured"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  )}
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Feature this product on the homepage
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              rows={5}
              {...register('description', { required: 'Description is required' })}
              className={`w-full p-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Product Images*</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
              </div>
            )}

            {images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {images.length} {images.length === 1 ? 'image' : 'images'} uploaded
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                        <Image
                          src={optimizeImage(image, 200, 200)}
                          alt={`Product image ${index + 1}`}
                          width={200}
                          height={200}
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/products"
              className="bg-white text-gray-600 border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className={`bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors ${
                (isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to convert file to base64
function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
