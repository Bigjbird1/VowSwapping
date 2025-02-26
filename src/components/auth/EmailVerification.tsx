'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function EmailVerification() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token');
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to verify email');
          setIsLoading(false);
          return;
        }

        setSuccess(true);
        setIsLoading(false);
      } catch (error) {
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Verifying Your Email</h1>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <p className="text-center text-gray-600">Please wait while we verify your email...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Verification Failed</h1>
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
          <p>{error}</p>
        </div>
        <p className="text-center text-gray-600 mb-6">
          The verification link may have expired or is invalid. Please try requesting a new
          verification email.
        </p>
        <Link
          href="/auth/signin"
          className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Email Verified!</h1>
      <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-6">
        <p>Your email has been successfully verified. You can now sign in to your account.</p>
      </div>
      <Link
        href="/auth/signin"
        className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Sign In
      </Link>
    </div>
  );
}
