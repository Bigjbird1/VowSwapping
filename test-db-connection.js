// Test database connection script
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

// Define database URL - use the production URL for testing
const TEST_DB_URL = process.env.DATABASE_URL || 'postgres://postgres.ayuukerzreoiqevkhhlv:Letmeinplease123!jzd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';

async function testConnection() {
  console.log('Testing database connection...');
  
  // Ensure the test schema exists
  console.log('Ensuring test schema exists...');
  try {
    execSync('node prisma/ensure-test-schema.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error ensuring test schema:', error);
    process.exit(1);
  }
  
  // Push the schema to the database
  console.log('Pushing schema to database...');
  process.env.DATABASE_URL = TEST_DB_URL;
  execSync(`npx prisma db push --schema=${path.join(process.cwd(), 'prisma', 'schema.prisma')}`, { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DB_URL }
  });
  
  // Create a new PrismaClient instance
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DB_URL,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // Test the connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connection successful!');
    
    // Test a simple query
    console.log('Testing query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
    // Create a test user
    console.log('Creating test user...');
    const email = `test-${Math.random().toString(36).substring(2, 15)}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        password: 'password123',
      },
    });
    console.log('Test user created:', user.id);
    
    // Retrieve the user
    console.log('Retrieving test user...');
    const retrievedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    console.log('Retrieved user:', retrievedUser.id, retrievedUser.email);
    
    // Clean up
    console.log('Cleaning up...');
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Test user deleted');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    // Disconnect
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testConnection().catch(console.error);
