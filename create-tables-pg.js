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

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database successfully!');
    console.log('Creating database tables...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Create enum types first
    console.log('Creating enum types...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderstatus') THEN
          CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'productcategory') THEN
          CREATE TYPE "ProductCategory" AS ENUM ('DRESSES', 'ACCESSORIES', 'DECORATIONS', 'OTHER');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'productcondition') THEN
          CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR');
        END IF;
      END
      $$;
    `);
    
    // Create User table
    console.log('Creating User table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "name" TEXT,
        "email" TEXT NOT NULL,
        "emailVerified" TIMESTAMP(3),
        "password" TEXT,
        "image" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "verificationToken" TEXT,
        "resetToken" TEXT,
        "resetTokenExpiry" TIMESTAMP(3),
        
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // Create unique index on User email
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `);
    
    // Create Address table
    console.log('Creating Address table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Address" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "street" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        "country" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "Address_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    // Create Product table
    console.log('Creating Product table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "discountPrice" DOUBLE PRECISION,
        "images" TEXT[] NOT NULL,
        "category" "ProductCategory" NOT NULL,
        "condition" "ProductCondition" NOT NULL,
        "tags" TEXT[] NOT NULL,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "sellerId" TEXT,
        
        CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    
    // Create Order table
    console.log('Creating Order table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "total" DOUBLE PRECISION NOT NULL,
        "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
        "addressId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    // Create OrderItem table
    console.log('Creating OrderItem table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
    
    // Create NextAuth tables
    console.log('Creating NextAuth tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        
        CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      );
    `);
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
    `);
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database tables created successfully!');
    
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables()
  .then(() => {
    console.log('Table creation process completed.');
  })
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
