const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to connect to the database...');
    
    // Try a simple query to test the connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('Connection successful!', result);
    
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('Database connection test completed successfully.');
    } else {
      console.log('Database connection test failed.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
