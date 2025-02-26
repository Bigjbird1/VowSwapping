const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('Checking if tables exist in the database...');
    
    // Check if User table exists
    const userTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'User'
      );
    `;
    
    // Check if Product table exists
    const productTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Product'
      );
    `;
    
    // Check if Order table exists
    const orderTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Order'
      );
    `;
    
    console.log('User table exists:', userTableExists[0].exists);
    console.log('Product table exists:', productTableExists[0].exists);
    console.log('Order table exists:', orderTableExists[0].exists);
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables()
  .then(() => {
    console.log('Table check completed.');
    process.exit(0);
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
