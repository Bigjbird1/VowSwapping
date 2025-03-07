import { PrismaClient } from '@prisma/client';

let prisma;

beforeAll(async () => {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL
      }
    }
  });

  // Ensure clean state before all tests
  await setupTestDatabase();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
});

beforeEach(async () => {
  // Clean up data before each test
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.address.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
    prisma.seller.deleteMany(),
  ]);
});

// Test context tracking utility
let currentTestContext = {};

export function setTestContext(suiteName, fileName) {
  currentTestContext = {
    suite: suiteName,
    file: fileName,
    startTime: new Date()
  };
  console.log(`\n=== Starting test context: ${suiteName} (${fileName}) ===`);
}

// Complete test database setup
export async function setupTestDatabase() {
  try {
    // Initialize test database connection
    await prisma.$connect();
    
    // Verify database connection
    await prisma.$queryRaw`SELECT current_database()`;
    console.log('Database connection verified');
    
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}
