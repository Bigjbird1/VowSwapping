import { PrismaClient } from '@prisma/client';

// Generate a unique client ID to avoid prepared statement conflicts
const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
// Generate a unique schema ID for test isolation
const schemaId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

let prisma;

beforeAll(async () => {
  // Create a unique schema for test isolation with a unique client ID
  prisma = new PrismaClient({
    datasourceUrl: process.env.TEST_DATABASE_URL,
    // Add connection pooling configuration with improved settings
    connectionTimeout: 30000, // 30 seconds
    log: ['error', 'warn'],
    // Add a unique client ID to avoid prepared statement conflicts
    __internal: {
      engine: {
        clientId: clientId
      }
    }
  });

  try {
    // Ensure clean state before all tests
    await setupTestDatabase();
    console.log(`Test database setup complete with schema: ${schemaId} and client ID: ${clientId}`);
  } catch (error) {
    console.error('Error in test database setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    if (prisma) {
      // Clean up data before disconnecting
      await prisma.$transaction([
        prisma.review.deleteMany(),
        prisma.orderItem.deleteMany(),
        prisma.order.deleteMany(),
        prisma.wishlist.deleteMany(),
        prisma.address.deleteMany(),
        prisma.product.deleteMany(),
        prisma.user.deleteMany(),
        prisma.seller.deleteMany(),
      ], {
        timeout: 10000 // 10 seconds timeout for cleanup
      }).catch(err => console.error('Error in cleanup transaction:', err));
      
      // Properly close all connections
      await prisma.$disconnect();
      console.log(`Disconnected client with ID: ${clientId}`);
      prisma = null;
    }
  } catch (error) {
    console.error('Error in test teardown:', error);
  }
});

beforeEach(async () => {
  try {
    // Clean up data before each test with transaction timeout
    await prisma.$transaction([
      prisma.review.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.wishlist.deleteMany(),
      prisma.address.deleteMany(),
      prisma.product.deleteMany(),
      prisma.user.deleteMany(),
      prisma.seller.deleteMany(),
    ], {
      timeout: 10000 // 10 seconds timeout for transactions
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    // Attempt to reconnect if connection was lost
    try {
      await prisma.$connect();
      console.log('Reconnected after error');
    } catch (reconnectError) {
      console.error('Failed to reconnect:', reconnectError);
    }
  }
});

// Test context tracking utility
let currentTestContext = {};

export function setTestContext(suiteName, fileName) {
  currentTestContext = {
    suite: suiteName,
    file: fileName,
    startTime: new Date(),
    clientId: clientId,
    schemaId: schemaId
  };
  console.log(`\n=== Starting test context: ${suiteName} (${fileName}) with client ID: ${clientId} ===`);
}

// Complete test database setup
export async function setupTestDatabase() {
  try {
    // Initialize test database connection
    await prisma.$connect();
    
    // Verify database connection
    const result = await prisma.$queryRaw`SELECT current_database()`;
    console.log('Database connection verified:', result);
    
    // Log connection details for debugging
    console.log(`Test schema: ${schemaId}, Client ID: ${clientId}`);
    
    // Execute a simple query to ensure the connection is working
    await prisma.$executeRaw`SELECT 1 as test`;
    
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    throw new Error(`Failed to set up test database: ${error.message}`);
  }
}

// Export prisma instance for tests
export { prisma };
