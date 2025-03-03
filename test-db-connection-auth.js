// Test script to check database connection and authentication functionality
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification in development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create a new PrismaClient instance
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Testing database connection...');
  
  try {
    // Test database connection
    // Use SQLite-compatible query to check connection
    const databaseTest = await prisma.$queryRaw`SELECT 1 as test;`;
    console.log('Database connection successful!');
    console.log('Database test result:', databaseTest);
    
    // Test user table access
    console.log('\nTesting user table access...');
    const userCount = await prisma.user.count();
    console.log(`User table accessible. Current user count: ${userCount}`);
    
    // Create a test user
    console.log('\nCreating a test user...');
    const testEmail = `test-${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        verificationToken: 'test-token',
      },
    });
    
    console.log(`Test user created with ID: ${testUser.id} and email: ${testUser.email}`);
    
    // Verify the user's email
    console.log('\nVerifying the test user\'s email...');
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      },
    });
    
    console.log('Test user email verified successfully');
    
    // Test password verification
    console.log('\nTesting password verification...');
    const retrievedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    
    const isPasswordValid = await bcrypt.compare('Password123!', retrievedUser.password);
    console.log(`Password verification ${isPasswordValid ? 'successful' : 'failed'}`);
    
    // Clean up - delete the test user
    console.log('\nCleaning up - deleting test user...');
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    
    console.log('Test user deleted successfully');
    
    console.log('\nAll database tests completed successfully!');
  } catch (error) {
    console.error('Database test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
