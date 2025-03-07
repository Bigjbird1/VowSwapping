'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerPendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sellerStatus, setSellerStatus] = useState<{
    isSeller: boolean;
    sellerApproved: boolean;
  } | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/seller/pending');
      return;
    }

    // Fetch seller status
    if (status === 'authenticated') {
      fetchSellerStatus();
    }
  }, [status, router]);

  const fetchSellerStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seller/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch seller status');
      }
      
      const data = await response.json();
      setSellerStatus(data);
      
      // Redirect if not a seller
      if (!data.isSeller) {
        router.push('/seller/register');
        return;
      }
      
      // Redirect if already approved
      if (data.sellerApproved) {
        router.push('/seller/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error fetching seller status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Your seller application is pending approval</h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a seller on VowSwap! Our team is currently reviewing your application.
            This process typically takes 1-2 business days. We'll notify you by email once your application has been approved.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              While you wait, you can prepare product photos and descriptions for your listings.
              Once approved, you'll be able to create your shop and start selling right away!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/"
              className="inline-block bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Return to Homepage
            </Link>
            
            <Link
              href="/profile"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
            >
              Go to Your Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
