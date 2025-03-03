import { PrismaClient } from '@prisma/client';
import { mockProducts } from '../src/lib/products';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  try {
    // Create a test user if none exists
    const userExists = await prisma.$queryRaw<[{count: number}]>`
      SELECT COUNT(*) FROM "User" WHERE email = 'test@example.com'
    `;
    
    let userId: string;
    
    if (Number(userExists[0].count) === 0) {
      console.log('Creating test user...');
      
      const result = await prisma.$executeRaw`
        INSERT INTO "User" (
          id, email, name, password, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'test@example.com', 'Test User', 
          '$2a$10$ixfH1PJfghfhfhfhfhfhfh', NOW(), NOW()
        ) RETURNING id
      `;
      
      const userResult = await prisma.$queryRaw<[{id: string}]>`
        SELECT id FROM "User" WHERE email = 'test@example.com'
      `;
      
      userId = userResult[0].id;
      console.log(`Created test user with id: ${userId}`);
    } else {
      console.log('Test user already exists');
      const userResult = await prisma.$queryRaw<[{id: string}]>`
        SELECT id FROM "User" WHERE email = 'test@example.com'
      `;
      userId = userResult[0].id;
    }
    
    // Seed products
    console.log('Seeding products...');
    
    for (const product of mockProducts) {
      // Convert category and condition to uppercase for database
      const category = product.category.toUpperCase();
      const condition = product.condition.toUpperCase().replace('-', '_');
      
      // Check if product exists
      const productExists = await prisma.$queryRaw<[{count: number}]>`
        SELECT COUNT(*) FROM "Product" WHERE id = ${product.id}
      `;
      
      if (Number(productExists[0].count) === 0) {
        console.log(`Creating product: ${product.title}`);
        
        await prisma.$executeRaw`
          INSERT INTO "Product" (
            id, title, description, price, "discountPrice", 
            images, category, condition, tags, featured, 
            "sellerId", "createdAt", "updatedAt", approved
          ) VALUES (
            ${product.id}, 
            ${product.title}, 
            ${product.description}, 
            ${product.price}, 
            ${product.discountPrice || null}, 
            ${JSON.stringify(product.images)}::jsonb, 
            ${category}, 
            ${condition}, 
            ${JSON.stringify(product.tags)}::jsonb, 
            ${product.featured || false}, 
            ${userId}, 
            ${new Date(product.createdAt)}, 
            ${new Date(product.updatedAt)},
            true
          )
        `;
      } else {
        console.log(`Product already exists: ${product.title}`);
      }
    }
    
    console.log('Seeding completed');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
