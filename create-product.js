const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createProduct() {
  try {
    console.log('Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Create a test user if none exists
    const userExists = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    let userId;
    
    if (!userExists) {
      console.log('Creating test user...');
      
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: '$2a$10$ixfH1PJfghfhfhfhfhfhfh',
        }
      });
      
      userId = user.id;
      console.log(`Created test user with id: ${userId}`);
    } else {
      console.log('Test user already exists');
      userId = userExists.id;
    }
    
    // Create a test product
    console.log('Creating test product...');
    
    const product = await prisma.product.create({
      data: {
        title: 'Test Wedding Dress',
        description: 'A beautiful test wedding dress',
        price: 1000,
        discountPrice: 800,
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        category: 'DRESSES',
        condition: 'LIKE_NEW',
        tags: ['test', 'wedding', 'dress'],
        featured: true,
        approved: true,
        sellerId: userId,
      }
    });
    
    console.log(`Created test product with id: ${product.id}`);
    
  } catch (error) {
    console.error('Error creating product:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProduct()
  .then(() => {
    console.log('Product creation completed successfully');
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
