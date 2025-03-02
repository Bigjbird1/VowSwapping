const { Pool } = require('pg');
require('dotenv').config();

// Parse the DATABASE_URL
const connectionString = process.env.DATABASE_URL;
console.log('Database URL:', connectionString ? 'Found' : 'Not found');

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString,
  ssl: true
});

async function addSellerFields() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database successfully!');
    console.log('Adding seller fields to User table...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if the columns already exist
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'isSeller';
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('Seller fields already exist in the User table.');
    } else {
      // Add seller fields to User table
      await client.query(`
        ALTER TABLE "User" 
        ADD COLUMN "isSeller" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN "sellerApproved" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN "shopName" TEXT,
        ADD COLUMN "shopDescription" TEXT,
        ADD COLUMN "sellerRating" DOUBLE PRECISION,
        ADD COLUMN "sellerRatingsCount" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN "sellerSince" TIMESTAMP(3),
        ADD COLUMN "sellerBio" TEXT,
        ADD COLUMN "sellerLogo" TEXT,
        ADD COLUMN "sellerBanner" TEXT,
        ADD COLUMN "sellerSocial" JSONB;
      `);
      
      console.log('Seller fields added to User table successfully!');
    }
    
    // Check if the Product table has the approved column
    const checkProductColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'approved';
    `;
    
    const productColumnExists = await client.query(checkProductColumnQuery);
    
    if (productColumnExists.rows.length > 0) {
      console.log('Approved field already exists in the Product table.');
    } else {
      // Add approved field to Product table
      await client.query(`
        ALTER TABLE "Product" 
        ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;
      `);
      
      console.log('Approved field added to Product table successfully!');
    }
    
    // Check if the Review table exists
    const checkReviewTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'Review';
    `;
    
    const reviewTableExists = await client.query(checkReviewTableQuery);
    
    if (reviewTableExists.rows.length > 0) {
      console.log('Review table already exists.');
    } else {
      // Create Review table
      await client.query(`
        CREATE TABLE "Review" (
          "id" TEXT NOT NULL,
          "rating" INTEGER NOT NULL,
          "comment" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "productId" TEXT,
          "sellerId" TEXT,
          "reviewerId" TEXT NOT NULL,
          "reviewerName" TEXT NOT NULL,
          
          CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "Review_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);
      
      console.log('Review table created successfully!');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database schema updated successfully!');
    
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error updating schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSellerFields()
  .then(() => {
    console.log('Schema update process completed.');
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
