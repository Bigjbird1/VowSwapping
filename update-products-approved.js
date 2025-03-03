const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function updateProducts() {
  try {
    console.log('Connecting to database...');
    
    // Update all products to set approved=true
    const result = await prisma.product.updateMany({
      where: {
        approved: false
      },
      data: {
        approved: true
      }
    });
    
    console.log(`Updated ${result.count} products to approved=true`);
    
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProducts()
  .then(() => {
    console.log('Update completed successfully');
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
