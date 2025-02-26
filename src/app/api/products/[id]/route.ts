import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';
import { ProductCategory } from '@/types/product';

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

// GET /api/products/[id] - Get a single product by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Properly await the params object
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT * FROM "Product" WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const product = mapDatabaseProductToAppProduct(result.rows[0]);
    
    return NextResponse.json({ product });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT /api/products/[id] - Update a product (admin/seller only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Properly await the params object
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  
  const client = await pool.connect();
  
  try {
    const data = await request.json();
    
    // Get user
    const userResult = await client.query(
      `SELECT id FROM "User" WHERE email = $1`,
      [session.user.email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userResult.rows[0].id;
    
    // Check if product exists and belongs to the user
    const productResult = await client.query(
      `SELECT * FROM "Product" WHERE id = $1`,
      [id]
    );
    
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const existingProduct = productResult.rows[0];
    
    // Only allow the seller to update their own products
    // In a real app, you might have admin roles that can update any product
    if (existingProduct.sellerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Prepare update data
    const {
      title,
      description,
      price,
      discountPrice,
      images,
      category,
      condition,
      tags,
      featured,
    } = data;
    
    // Build update query
    let updateQuery = `UPDATE "Product" SET "updatedAt" = NOW()`;
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (title) {
      updateQuery += `, title = $${paramIndex}`;
      queryParams.push(title);
      paramIndex++;
    }
    
    if (description) {
      updateQuery += `, description = $${paramIndex}`;
      queryParams.push(description);
      paramIndex++;
    }
    
    if (price !== undefined) {
      updateQuery += `, price = $${paramIndex}`;
      queryParams.push(parseFloat(price));
      paramIndex++;
    }
    
    if (discountPrice !== undefined) {
      updateQuery += `, "discountPrice" = $${paramIndex}`;
      queryParams.push(discountPrice ? parseFloat(discountPrice) : null);
      paramIndex++;
    }
    
    if (images) {
      updateQuery += `, images = $${paramIndex}`;
      queryParams.push(images);
      paramIndex++;
    }
    
    if (category) {
      updateQuery += `, category = $${paramIndex}`;
      queryParams.push(category.toUpperCase());
      paramIndex++;
    }
    
    if (condition) {
      updateQuery += `, condition = $${paramIndex}`;
      queryParams.push(condition.toUpperCase().replace('-', '_'));
      paramIndex++;
    }
    
    if (tags) {
      updateQuery += `, tags = $${paramIndex}`;
      queryParams.push(tags);
      paramIndex++;
    }
    
    if (featured !== undefined) {
      updateQuery += `, featured = $${paramIndex}`;
      queryParams.push(featured);
      paramIndex++;
    }
    
    // Add WHERE clause and RETURNING
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    queryParams.push(id);
    
    // Execute update
    const result = await client.query(updateQuery, queryParams);
    const updatedProduct = mapDatabaseProductToAppProduct(result.rows[0]);
    
    return NextResponse.json({ 
      success: true, 
      product: updatedProduct 
    });
    
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE /api/products/[id] - Delete a product (admin/seller only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Properly await the params object
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  
  const client = await pool.connect();
  
  try {
    // Get user
    const userResult = await client.query(
      `SELECT id FROM "User" WHERE email = $1`,
      [session.user.email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userResult.rows[0].id;
    
    // Check if product exists and belongs to the user
    const productResult = await client.query(
      `SELECT * FROM "Product" WHERE id = $1`,
      [id]
    );
    
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const existingProduct = productResult.rows[0];
    
    // Only allow the seller to delete their own products
    // In a real app, you might have admin roles that can delete any product
    if (existingProduct.sellerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete product
    await client.query(
      `DELETE FROM "Product" WHERE id = $1`,
      [id]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
    
  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
