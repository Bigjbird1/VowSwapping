import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';
import { ProductCategory, ProductCondition } from '@/types/product';

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// Helper function to map database product to application product
function mapDatabaseProductToAppProduct(dbProduct: any) {
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    description: dbProduct.description,
    price: dbProduct.price,
    discountPrice: dbProduct.discountPrice || undefined,
    images: dbProduct.images,
    category: dbProduct.category.toLowerCase() as ProductCategory,
    condition: dbProduct.condition.toLowerCase().replace('_', '-') as any,
    tags: dbProduct.tags,
    createdAt: dbProduct.createdAt.toISOString(),
    updatedAt: dbProduct.updatedAt.toISOString(),
    featured: dbProduct.featured,
    sellerId: dbProduct.sellerId
  };
}

// GET /api/products - Get all products with optional filtering
export async function GET(request: Request) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const category = searchParams.get('category') as string | null;
    const condition = searchParams.get('condition') as string | null;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const searchQuery = searchParams.get('searchQuery');
    
    // Build SQL query
    let query = `
      SELECT * FROM "Product"
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      queryParams.push(category.toUpperCase());
      paramIndex++;
    }
    
    if (condition) {
      query += ` AND condition = $${paramIndex}`;
      queryParams.push(condition.toUpperCase().replace('-', '_'));
      paramIndex++;
    }
    
    // Price filtering
    if (minPrice !== undefined) {
      query += ` AND (price >= $${paramIndex} OR (discountPrice IS NOT NULL AND discountPrice >= $${paramIndex}))`;
      queryParams.push(minPrice);
      paramIndex++;
    }
    
    if (maxPrice !== undefined) {
      query += ` AND (price <= $${paramIndex} OR (discountPrice IS NOT NULL AND discountPrice <= $${paramIndex}))`;
      queryParams.push(maxPrice);
      paramIndex++;
    }
    
    // Search query
    if (searchQuery) {
      query += ` AND (
        title ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex} OR 
        $${paramIndex + 1} = ANY(tags)
      )`;
      queryParams.push(`%${searchQuery}%`);
      queryParams.push(searchQuery);
      paramIndex += 2;
    }
    
    // Add ordering
    query += ` ORDER BY "createdAt" DESC`;
    
    // Execute query
    const result = await client.query(query, queryParams);
    const products = result.rows.map(mapDatabaseProductToAppProduct);
    
    return NextResponse.json({ products });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST /api/products - Create a new product (admin/seller only)
export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = await pool.connect();
  
  try {
    const data = await request.json();
    const { 
      title, 
      description, 
      price, 
      discountPrice, 
      images, 
      category, 
      condition, 
      tags,
      featured 
    } = data;
    
    // Validate required fields
    if (!title || !description || price === undefined || !images || !category || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get user
    const userResult = await client.query(
      `SELECT id FROM "User" WHERE email = $1`,
      [session.user.email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userResult.rows[0].id;
    
    // Generate a UUID for the product
    const productIdResult = await client.query(`SELECT gen_random_uuid() as id`);
    const productId = productIdResult.rows[0].id;
    
    // Create product
    const result = await client.query(
      `
        INSERT INTO "Product" (
          id, title, description, price, "discountPrice", 
          images, category, condition, tags, featured, 
          "sellerId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, $10, 
          $11, NOW(), NOW()
        ) RETURNING *
      `,
      [
        productId,
        title,
        description,
        parseFloat(price),
        discountPrice ? parseFloat(discountPrice) : null,
        images,
        category.toUpperCase(),
        condition.toUpperCase().replace('-', '_'),
        tags || [],
        featured || false,
        userId
      ]
    );
    
    const product = mapDatabaseProductToAppProduct(result.rows[0]);
    
    return NextResponse.json({ 
      success: true, 
      product 
    });
    
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
