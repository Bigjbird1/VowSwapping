const { Pool } = require('pg');
require('dotenv').config();

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Parse the DATABASE_URL
const connectionString = process.env.DATABASE_URL;
console.log('Database URL:', connectionString ? 'Found' : 'Not found');

const pool = new Pool({
  connectionString,
  ssl: true
});

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
    category: 'DRESSES',
    condition: 'LIKE_NEW',
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
    discountPrice: null,
    images: [
      'https://images.unsplash.com/photo-1546167889-0b4b5ff0aec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'ACCESSORIES',
    condition: 'NEW',
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
    category: 'DECORATIONS',
    condition: 'GOOD',
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
    category: 'DRESSES',
    condition: 'LIKE_NEW',
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
    discountPrice: null,
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'ACCESSORIES',
    condition: 'NEW',
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
    discountPrice: null,
    images: [
      'https://images.unsplash.com/photo-1547393947-1849a9bc22f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'DECORATIONS',
    condition: 'GOOD',
    tags: ['lights', 'string lights', 'reception'],
    createdAt: '2023-03-10T11:30:00Z',
    updatedAt: '2023-03-10T11:30:00Z',
    featured: true,
  },
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database successfully!');
    console.log('Starting seed...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Create a test user if none exists
    console.log('Creating test user...');
    const userExists = await client.query(`
      SELECT COUNT(*) FROM "User" WHERE email = 'test@example.com'
    `);
    
    let userId;
    
    if (parseInt(userExists.rows[0].count) === 0) {
      console.log('Creating new test user...');
      
      // Generate a UUID for the user
      const userIdResult = await client.query(`
        SELECT gen_random_uuid() as id
      `);
      
      userId = userIdResult.rows[0].id;
      
      await client.query(`
        INSERT INTO "User" (
          id, email, name, password, "createdAt", "updatedAt"
        ) VALUES (
          $1, 'test@example.com', 'Test User', 
          '$2a$10$ixfH1PJfghfhfhfhfhfhfh', NOW(), NOW()
        )
      `, [userId]);
      
      console.log(`Created test user with id: ${userId}`);
    } else {
      console.log('Test user already exists');
      const userResult = await client.query(`
        SELECT id FROM "User" WHERE email = 'test@example.com'
      `);
      userId = userResult.rows[0].id;
    }
    
    // Seed products
    console.log('Seeding products...');
    
    for (const product of mockProducts) {
      // Check if product exists
      const productExists = await client.query(`
        SELECT COUNT(*) FROM "Product" WHERE id = $1
      `, [product.id]);
      
      if (parseInt(productExists.rows[0].count) === 0) {
        console.log(`Creating product: ${product.title}`);
        
        // Convert JavaScript arrays to PostgreSQL arrays
        const imagesArray = `{${product.images.map(img => `"${img}"`).join(',')}}`;
        const tagsArray = `{${product.tags.map(tag => `"${tag}"`).join(',')}}`;
        
        await client.query(`
          INSERT INTO "Product" (
            id, title, description, price, "discountPrice", 
            images, category, condition, tags, featured, 
            "sellerId", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, 
            $6::text[], $7, $8, $9::text[], $10, 
            $11, $12, $13
          )
        `, [
          product.id, 
          product.title, 
          product.description, 
          product.price, 
          product.discountPrice, 
          product.images, // PostgreSQL will handle the array conversion with the ::text[] cast
          product.category, 
          product.condition, 
          product.tags, // PostgreSQL will handle the array conversion with the ::text[] cast
          product.featured, 
          userId, 
          new Date(product.createdAt), 
          new Date(product.updatedAt)
        ]);
      } else {
        console.log(`Product already exists: ${product.title}`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Seeding completed successfully!');
    
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error during seeding:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase()
  .then(() => {
    console.log('Seed process completed.');
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
