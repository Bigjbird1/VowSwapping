import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AddressManager from '@/components/profile/AddressManager';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Your Addresses | VowSwap',
  description: 'Manage your shipping addresses',
};

export default async function AddressesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const addresses = await prisma.address.findMany({
    where: {
      userId: user.id,
    },
    orderBy: [
      {
        isDefault: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <nav className="space-y-2">
                <a
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Profile
                </a>
                <a
                  href="/profile/addresses"
                  className="block px-3 py-2 rounded-md bg-primary-50 text-primary-700 font-medium"
                >
                  Addresses
                </a>
                <a
                  href="/profile/orders"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Orders
                </a>
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <AddressManager addresses={addresses} />
          </div>
        </div>
      </div>
    </div>
  );
}
