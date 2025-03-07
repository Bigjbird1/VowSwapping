// Simple database connection test
const { PrismaClient } = require('@prisma/client');

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification in development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use the connection string from .env
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres.ayuukerzreoiqevkhhlv:Letmeinplease123!jzd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';

async function testConnection() {
  console.log(`Testing connection to: ${DATABASE_URL}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
    log: ['query', 'error', 'warn'],
  });
  
  try {
    // Test the connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connection successful!');
    
    // Test a simple query using findFirst instead of raw query
    console.log('Testing query...');
    
    // Check if the User model exists
    try {
      const userCount = await prisma.user.count();
      console.log('User count:', userCount);
      console.log('User model exists and is accessible');
    } catch (error) {
      console.error('Error accessing User model:', error);
    }
    
    // Check if the Product model exists
    try {
      const productCount = await prisma.product.count();
      console.log('Product count:', productCount);
      console.log('Product model exists and is accessible');
    } catch (error) {
      console.error('Error accessing Product model:', error);
    }
    
    console.log('Connection test passed!');
    return true;
  } catch (error) {
    console.error('Connection test failed with error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testConnection().catch(console.error);
