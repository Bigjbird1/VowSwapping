// Script to apply the version field and inventory field migrations to the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Applying version and inventory field migrations...');
    
    // Execute the SQL migrations directly
    console.log('Adding version field to User model...');
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`;
    
    console.log('Adding version field to Product model...');
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`;
    
    console.log('Adding inventory field to Product model...');
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "inventory" INTEGER`;
    
    console.log('Migrations applied successfully!');
    
    // Verify the migrations
    const userCount = await prisma.user.count();
    console.log(`Verified ${userCount} users now have a version field`);
    
    const productCount = await prisma.product.count();
    console.log(`Verified ${productCount} products now have version and inventory fields`);
    
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
