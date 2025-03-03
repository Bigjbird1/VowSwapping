const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Get all products
    const allProducts = await prisma.product.findMany();
    console.log(`Total products in database: ${allProducts.length}`);
    
    // Get approved products
    const approvedProducts = await prisma.product.findMany({
      where: {
        approved: true
      }
    });
    console.log(`Approved products: ${approvedProducts.length}`);
    
    // Get unapproved products
    const unapprovedProducts = await prisma.product.findMany({
      where: {
        approved: false
      }
    });
    console.log(`Unapproved products: ${unapprovedProducts.length}`);
    
    // Print details of all products
    console.log('\nProduct details:');
    allProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Title: ${product.title}`);
      console.log(`  Approved: ${product.approved}`);
      console.log(`  Featured: ${product.featured}`);
      console.log(`  Category: ${product.category}`);
    });
    
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts()
  .then(() => {
    console.log('\nCheck completed successfully');
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
