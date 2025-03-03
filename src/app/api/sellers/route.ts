import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all approved sellers
    const sellers = await prisma.user.findMany({
      where: {
        isSeller: true,
        sellerApproved: true,
      },
      select: {
        id: true,
        name: true,
        shopName: true,
        sellerRating: true,
        sellerRatingsCount: true,
        sellerSince: true,
        // Count products for each seller
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        shopName: 'asc',
      },
    });

    // Format the response
    const formattedSellers = sellers.map(seller => ({
      id: seller.id,
      name: seller.name,
      shopName: seller.shopName,
      sellerRating: seller.sellerRating,
      sellerRatingsCount: seller.sellerRatingsCount,
      sellerSince: seller.sellerSince,
      productCount: seller._count.products,
    }));

    return NextResponse.json({ sellers: formattedSellers });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}
