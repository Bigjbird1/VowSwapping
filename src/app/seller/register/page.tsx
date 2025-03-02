'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const sellerRegistrationSchema = z.object({
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  shopDescription: z.string().min(20, 'Description must be at least 20 characters'),
  sellerBio: z.string().min(20, 'Bio must be at least 20 characters'),
  sellerLogo: z.string().optional(),
  sellerBanner: z.string().optional(),
  sellerSocial: z.object({
    website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
});

type SellerRegistrationFormValues = z.infer<typeof sellerRegistrationSchema>;

export default function SellerRegistrationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SellerRegistrationFormValues>({
    resolver: zodResolver(sellerRegistrationSchema),
    defaultValues: {
      shopName: '',
      shopDescription: '',
      sellerBio: '',
      sellerSocial: {
        website: '',
        instagram: '',
        facebook: '',
        twitter: '',
      },
    },
  });

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/seller/register');
    return null;
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload logo');
      }
      
      setValue('sellerLogo', data.url);
      setLogoPreview(data.url);
    } catch (err) {
      setError('Failed to upload logo. Please try again.');
      console.error('Logo upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload banner');
      }
      
      setValue('sellerBanner', data.url);
      setBannerPreview(data.url);
    } catch (err) {
      setError('Failed to upload banner. Please try again.');
      console.error('Banner upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SellerRegistrationFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/seller/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to register as a seller');
      }
      
      setSuccess('Your seller application has been submitted successfully! We will review your application and get back to you soon.');
      
      // Redirect to seller dashboard after a delay
      setTimeout(() => {
        router.push('/seller/pending');
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Seller registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Become a Seller on VowSwap</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Why Sell on VowSwap?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium mb-2">Earn Extra Income</h3>
              <p className="text-gray-600 text-sm">Turn your wedding items into cash by selling to couples planning their special day.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium mb-2">Reach More Customers</h3>
              <p className="text-gray-600 text-sm">Access our growing community of engaged couples looking for unique wedding items.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium mb-2">Easy to Manage</h3>
              <p className="text-gray-600 text-sm">Our seller dashboard makes it simple to list products, track orders, and manage your shop.</p>
            </div>
          </div>
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
          <h2 className="text-xl font-semibold mb-6">Seller Application</h2>
          
          <div className="mb-4">
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name *
            </label>
            <input
              id="shopName"
              type="text"
              {...register('shopName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            {errors.shopName && (
              <p className="mt-1 text-sm text-red-600">{errors.shopName.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="shopDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Shop Description *
            </label>
            <textarea
              id="shopDescription"
              {...register('shopDescription')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
              placeholder="Tell customers about your shop, what you sell, and your unique value proposition."
            />
            {errors.shopDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.shopDescription.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="sellerBio" className="block text-sm font-medium text-gray-700 mb-1">
              Seller Bio *
            </label>
            <textarea
              id="sellerBio"
              {...register('sellerBio')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
              placeholder="Share a bit about yourself, your background, and why you're passionate about wedding items."
            />
            {errors.sellerBio && (
              <p className="mt-1 text-sm text-red-600">{errors.sellerBio.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Logo
              </label>
              <div className="mt-1 flex items-center">
                {logoPreview ? (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden mr-4">
                    <Image
                      src={logoPreview}
                      alt="Shop logo preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  id="logoUpload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="logoUpload"
                  className="cursor-pointer py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">Recommended size: 500x500px. Max 2MB.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Banner
              </label>
              <div className="mt-1 flex items-center">
                {bannerPreview ? (
                  <div className="relative w-40 h-24 rounded-md overflow-hidden mr-4">
                    <Image
                      src={bannerPreview}
                      alt="Shop banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-24 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  id="bannerUpload"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="bannerUpload"
                  className="cursor-pointer py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">Recommended size: 1200x400px. Max 2MB.</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  {...register('sellerSocial.website')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://yourwebsite.com"
                  disabled={isLoading}
                />
                {errors.sellerSocial?.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.sellerSocial.website.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  id="instagram"
                  type="text"
                  {...register('sellerSocial.instagram')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="@yourusername"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  id="facebook"
                  type="text"
                  {...register('sellerSocial.facebook')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Your Facebook page"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter
                </label>
                <input
                  id="twitter"
                  type="text"
                  {...register('sellerSocial.twitter')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="@yourusername"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <Link href="/terms" className="text-primary-600 hover:text-primary-500">Terms and Conditions</Link> and <Link href="/privacy" className="text-primary-600 hover:text-primary-500">Privacy Policy</Link>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
