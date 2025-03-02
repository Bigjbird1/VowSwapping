'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }

    // For MVP, we'll consider all authenticated users as authorized
    // In a production app, you would check for admin/seller roles
    if (status === 'authenticated' && session?.user) {
      setIsAuthorized(true);
    }

    setIsLoading(false);
  }, [status, session, router]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You do not have permission to access the admin dashboard.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Product Management Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Product Management</h2>
          <p className="text-gray-600 mb-4">
            Create, edit, and manage your product listings.
          </p>
          <div className="flex space-x-3">
            <Link
              href="/admin/products"
              className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              View Products
            </Link>
            <Link
              href="/admin/products/create"
              className="inline-block bg-white text-primary-600 border border-primary-600 px-4 py-2 rounded-md hover:bg-primary-50 transition-colors"
            >
              Add Product
            </Link>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Order Management</h2>
          <p className="text-gray-600 mb-4">
            View and manage customer orders.
          </p>
          <Link
            href="/admin/orders"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            View Orders
          </Link>
        </div>

        {/* Account Settings Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Account Settings</h2>
          <p className="text-gray-600 mb-4">
            Manage your seller profile and account settings.
          </p>
          <Link
            href="/profile"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Profile Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
