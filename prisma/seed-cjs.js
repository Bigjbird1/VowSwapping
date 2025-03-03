const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define the mock products data
const mockProducts = [
  {
    id: '1',
    title: 'Elegant Lace Wedding Dress',
    description: 'A beautiful lace wedding dress with a sweetheart neckline and chapel train. Perfect for a traditional wedding.',
    price: 1200,
    discountPrice: 899,
    images: [
      'https://images.unsplash.com/photo-1594552072238-5c4a26f10bfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      'https://images.unsplash.com/photo-1596451190630-186aff535bf2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'dresses',
    condition: 'like-new',
    tags: ['lace', 'white', 'sweetheart', 'chapel train'],
    createdAt: '2023-01-15T12:00:00Z',
    updatedAt: '2023-01-15T12:00:00Z',
    featured: true,
  },
  {
    id: '2',
    title: 'Crystal Bridal Tiara',
    description: 'Stunning crystal tiara that will make you feel like royalty on your special day.',
    price: 250,
    images: [
      'https://images.unsplash.com/photo-1546167889-0b4b5ff0aec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'accessories',
    condition: 'new',
    tags: ['tiara', 'crystal', 'silver'],
    createdAt: '2023-02-10T14:30:00Z',
    updatedAt: '2023-02-10T14:30:00Z',
    featured: true,
  },
  {
    id: '3',
    title: 'Rustic Wedding Centerpieces (Set of 10)',
    description: 'Beautiful rustic centerpieces featuring mason jars, burlap, and artificial flowers. Perfect for a country or barn wedding.',
    price: 350,
    discountPrice: 299,
    images: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'decorations',
    condition: 'good',
    tags: ['rustic', 'centerpieces', 'mason jars', 'burlap'],
    createdAt: '2023-03-05T09:15:00Z',
    updatedAt: '2023-03-05T09:15:00Z',
    featured: true,
  },
  {
    id: '4',
    title: 'Mermaid Style Wedding Dress',
    description: 'Stunning mermaid style wedding dress with beaded details and a dramatic train.',
    price: 1500,
    discountPrice: 1200,
    images: [
      'https://images.unsplash.com/photo-1585241920473-b472eb9ffbae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'dresses',
    condition: 'like-new',
    tags: ['mermaid', 'beaded', 'train'],
    createdAt: '2023-01-20T10:45:00Z',
    updatedAt: '2023-01-20T10:45:00Z',
    featured: false,
  },
  {
    id: '5',
    title: 'Pearl Bridal Earrings',
    description: 'Elegant pearl drop earrings that add a touch of sophistication to your bridal look.',
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'accessories',
    condition: 'new',
    tags: ['earrings', 'pearl', 'elegant'],
    createdAt: '2023-02-15T16:20:00Z',
    updatedAt: '2023-02-15T16:20:00Z',
    featured: false,
  },
  {
    id: '6',
    title: 'String Lights (100ft)',
    description: 'Warm white string lights perfect for creating a magical atmosphere at your wedding reception.',
    price: 80,
    images: [
      'https://images.unsplash.com/photo-1547393947-1849a9bc22f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'decorations',
    condition: 'good',
    tags: ['lights', 'string lights', 'reception'],
    createdAt: '2023-03-10T11:30:00Z',
    updatedAt: '2023-03-10T11:30:00Z',
    featured: true,
  },
];

async function main() {
  console.log('Starting seed...');

  try {
    // Create a test user if none exists
    const userExists = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "User" WHERE email = 'test@example.com'
    `;
    
    let userId;
    
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
      
      const userResult = await prisma.$queryRaw`
        SELECT id FROM "User" WHERE email = 'test@example.com'
      `;
      
      userId = userResult[0].id;
      console.log(`Created test user with id: ${userId}`);
    } else {
      console.log('Test user already exists');
      const userResult = await prisma.$queryRaw`
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
      const productExists = await prisma.$queryRaw`
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
