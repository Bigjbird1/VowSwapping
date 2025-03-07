import { setTestContext, setupTestDatabase } from './db-test-setup';
import { prisma } from '@/lib/prisma';

describe('Database Test Setup', () => {
  beforeAll(async () => {
    setTestContext('Database Setup Tests', 'db-test-setup.test.js');
    await setupTestDatabase();
  });

  it('should initialize test database', async () => {
    const result = await setupTestDatabase();
    expect(result).toBe(true);
  });

  it('should have clean tables', async () => {
    const users = await prisma.user.findMany();
    const products = await prisma.product.findMany();
    const orders = await prisma.order.findMany();
    const addresses = await prisma.address.findMany();
    const wishlistItems = await prisma.wishlist.findMany();
    const reviews = await prisma.review.findMany();
    
    expect(users).toHaveLength(0);
    expect(products).toHaveLength(0);
    expect(orders).toHaveLength(0);
    expect(addresses).toHaveLength(0);
    expect(wishlistItems).toHaveLength(0);
    expect(reviews).toHaveLength(0);
  });
});
