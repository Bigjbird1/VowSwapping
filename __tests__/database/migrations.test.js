import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const { 
  setupTestDatabase, 
  getTestPrismaClient, 
  generateUniqueEmail,
  setTestContext,
  resetTestState,
  createTestUser,
  cleanupTestData,
  closeAllConnections
} = require('./db-test-setup');

// Create a new instance of PrismaClient for testing
let prisma;

// Set up test context and database before all tests
beforeAll(async () => {
  // Increase timeout to 60 seconds for database setup
  jest.setTimeout(60000);
  try {
    // Set initial test context
    setTestContext('Database Migration Tests', 'migrations.test.js');
    
    // Initialize the test database
    const setupSuccess = await setupTestDatabase();
    if (!setupSuccess) {
      throw new Error('Failed to set up test database');
    }
    
    // Create a new PrismaClient instance
    prisma = getTestPrismaClient();
    
    // Test the connection by checking if the User model exists
    if (!prisma.user) {
      throw new Error('User model not found in Prisma client');
    }
    
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('Test database and Prisma client initialized successfully for migration tests');
  } catch (error) {
    console.error('Error in beforeAll setup:', error);
    throw error;
  }
});

describe('Database Migrations', () => {
  // Set up test context before each test
  beforeEach(() => {
    // Set test name and suite name from current test context
    const state = expect.getState();
    setTestContext(state.currentTestName, state.testPath);
    // Reset test state to ensure consistent email generation within tests
    resetTestState();
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      await cleanupTestData(prisma);
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error in afterAll cleanup:', error);
    }
  });

  describe('Migration Structure', () => {
    it('should have valid migration files', () => {
      // Get all migration directories
      const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
      const migrationDirs = fs.readdirSync(migrationsPath)
        .filter(dir => fs.statSync(path.join(migrationsPath, dir)).isDirectory());

      // Verify each migration directory has a migration.sql file
      migrationDirs.forEach(dir => {
        const migrationFile = path.join(migrationsPath, dir, 'migration.sql');
        expect(fs.existsSync(migrationFile)).toBe(true);
        
        // Verify migration file is not empty
        const content = fs.readFileSync(migrationFile, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Migration Application', () => {
  // This test requires a temporary schema
  // It will apply migrations and verify the schema
  it('should apply migrations successfully', async () => {
    // Create a temporary test database URL with a unique schema for migrations
    const migrationSchemaName = `test_migrations_${Date.now()}`;
    const migrationDbUrl = `postgresql://postgres:Pleasework123!@db.ayuukerzreoiqevkhhlv.supabase.co:5432/postgres?schema=${migrationSchemaName}`;
    let testPrisma;
    
    try {
      // Close any existing connections
      await closeAllConnections();
      
      // Create a temporary client to create and clean the schema
      const setupPrisma = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } },
      });
      
      try {
        // Create the migration schema
        await setupPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${migrationSchemaName}`;
        
        // Grant necessary permissions
        await setupPrisma.$executeRaw`GRANT ALL ON SCHEMA ${migrationSchemaName} TO postgres`;
      } finally {
        await setupPrisma.$disconnect();
      }
      
      // Apply migrations to test schema with --force flag
      execSync(`npx prisma migrate reset --force --skip-generate --skip-seed`, {
        env: { ...process.env, DATABASE_URL: migrationDbUrl },
        stdio: 'pipe'
      });
      
      // Connect to the test database with connection pooling limits
      testPrisma = new PrismaClient({
        datasources: {
          db: {
            url: migrationDbUrl,
          },
        },
        // Configure connection pooling for PostgreSQL
        connection: {
          pool: {
            min: 1,
            max: 5,
            idleTimeoutMillis: 30000,
            acquireTimeoutMillis: 30000
          }
        }
      });
      
      try {
        // Verify the schema by checking if tables exist
        // We'll use raw queries to check table existence
        const tables = await testPrisma.$queryRaw`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = ${migrationSchemaName}
        `;
        
        // Check for expected tables
        const tableNames = Array.isArray(tables) ? tables.map(t => t.tablename.toLowerCase()) : [];
        expect(tableNames).toContain('user');
        expect(tableNames).toContain('product');
        expect(tableNames).toContain('order');
        expect(tableNames).toContain('orderitem');
        expect(tableNames).toContain('address');
        expect(tableNames).toContain('wishlist');
        expect(tableNames).toContain('review');
      } finally {
        // Always disconnect from test database
        if (testPrisma) {
          await testPrisma.$disconnect();
        }
      }
    } catch (error) {
      console.error('Migration test failed:', error);
      throw error;
    } finally {
      // Clean up test schema
      try {
        // Ensure connection is closed
        if (testPrisma) {
          await testPrisma.$disconnect();
        }
        await closeAllConnections();
        
        // Drop the migration schema
        const cleanupPrisma = new PrismaClient({
          datasources: { db: { url: process.env.DATABASE_URL } },
        });
        
        try {
          await cleanupPrisma.$executeRaw`DROP SCHEMA IF EXISTS ${migrationSchemaName} CASCADE`;
        } finally {
          await cleanupPrisma.$disconnect();
        }
      } catch (e) {
        console.warn('Could not clean up test schema:', e);
      }
    }
  });
    
  it('should successfully rollback migrations', async () => {
    // Create a temporary test database URL with a unique schema for rollback testing
    const rollbackSchemaName = `test_rollback_${Date.now()}`;
    const rollbackDbUrl = `postgresql://postgres:Pleasework123!@db.ayuukerzreoiqevkhhlv.supabase.co:5432/postgres?schema=${rollbackSchemaName}`;
    let testPrisma;
    
    try {
      // Close any existing connections
      await closeAllConnections();
      
      // Create a temporary client to create and clean the schema
      const setupPrisma = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } },
      });
      
      try {
        // Create the rollback schema
        await setupPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${rollbackSchemaName}`;
        
        // Grant necessary permissions
        await setupPrisma.$executeRaw`GRANT ALL ON SCHEMA ${rollbackSchemaName} TO postgres`;
      } finally {
        await setupPrisma.$disconnect();
      }
      
      // Get migration directories to determine the latest migration
      const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
      const migrationDirs = fs.readdirSync(migrationsPath)
        .filter(dir => fs.statSync(path.join(migrationsPath, dir)).isDirectory())
        .sort(); // Sort to get them in chronological order
      
      // Apply all migrations
      execSync(`npx prisma migrate deploy`, {
        env: { ...process.env, DATABASE_URL: rollbackDbUrl },
        stdio: 'pipe'
      });
      
      // Connect to the test database
      testPrisma = new PrismaClient({
        datasources: {
          db: {
            url: rollbackDbUrl,
          },
        }
      });
      
      // Verify all migrations were applied by checking for the latest tables
      const tablesBeforeRollback = await testPrisma.$queryRaw`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = ${rollbackSchemaName}
      `;
      
      const tableNamesBeforeRollback = Array.isArray(tablesBeforeRollback) 
        ? tablesBeforeRollback.map(t => t.tablename.toLowerCase()) 
        : [];
      
      // Check for tables from the latest migrations
      expect(tableNamesBeforeRollback).toContain('wishlist');
      expect(tableNamesBeforeRollback).toContain('review');
      
      // Now rollback the latest migration (review model)
      // We'll use a direct SQL approach since Prisma doesn't have a built-in rollback command
      // This simulates what a down() function would do in a migration system that supports it
      
      // First disconnect the client
      await testPrisma.$disconnect();
      
      // Execute SQL to drop the review table (simulating a rollback)
      const rollbackSql = `
        DROP TABLE IF EXISTS "${rollbackSchemaName}"."Review";
      `;
      
      // Create a new connection to execute the rollback
      const rollbackPrisma = new PrismaClient({
        datasources: {
          db: {
            url: rollbackDbUrl,
          },
        }
      });
      
      try {
        // Execute the rollback SQL
        await rollbackPrisma.$executeRawUnsafe(rollbackSql);
        
        // Verify the review table was dropped
        const tablesAfterRollback = await rollbackPrisma.$queryRaw`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = ${rollbackSchemaName}
        `;
        
        const tableNamesAfterRollback = Array.isArray(tablesAfterRollback) 
          ? tablesAfterRollback.map(t => t.tablename.toLowerCase()) 
          : [];
        
        // Review table should be gone, but wishlist should still exist
        expect(tableNamesAfterRollback).not.toContain('review');
        expect(tableNamesAfterRollback).toContain('wishlist');
        
      } finally {
        // Always disconnect
        await rollbackPrisma.$disconnect();
      }
    } catch (error) {
      console.error('Migration rollback test failed:', error);
      throw error;
    } finally {
      // Clean up test schema
      try {
        // Ensure connection is closed
        if (testPrisma) {
          await testPrisma.$disconnect();
        }
        await closeAllConnections();
        
        // Drop the rollback schema
        const cleanupPrisma = new PrismaClient({
          datasources: { db: { url: process.env.DATABASE_URL } },
        });
        
        try {
          await cleanupPrisma.$executeRaw`DROP SCHEMA IF EXISTS ${rollbackSchemaName} CASCADE`;
        } finally {
          await cleanupPrisma.$disconnect();
        }
      } catch (e) {
        console.warn('Could not clean up test schema:', e);
      }
    }
  });
  
  it('should verify migration idempotency', async () => {
    // Create a temporary test database URL with a unique schema for idempotency testing
    const idempotencySchemaName = `test_idempotent_${Date.now()}`;
    const idempotencyDbUrl = `postgresql://postgres:Pleasework123!@db.ayuukerzreoiqevkhhlv.supabase.co:5432/postgres?schema=${idempotencySchemaName}`;
    
    try {
      // Close any existing connections
      await closeAllConnections();
      
      // Create a temporary client to create and clean the schema
      const setupPrisma = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } },
      });
      
      try {
        // Create the idempotency schema
        await setupPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${idempotencySchemaName}`;
        
        // Grant necessary permissions
        await setupPrisma.$executeRaw`GRANT ALL ON SCHEMA ${idempotencySchemaName} TO postgres`;
      } finally {
        await setupPrisma.$disconnect();
      }
      
      // Apply migrations
      execSync(`npx prisma migrate deploy`, {
        env: { ...process.env, DATABASE_URL: idempotencyDbUrl },
        stdio: 'pipe'
      });
      
      // Apply migrations again - this should be idempotent and not cause errors
      const result = execSync(`npx prisma migrate deploy`, {
        env: { ...process.env, DATABASE_URL: idempotencyDbUrl },
        stdio: 'pipe'
      });
      
      // Verify the second migration application was successful
      expect(result.toString()).not.toContain('error');
      
    } catch (error) {
      console.error('Migration idempotency test failed:', error);
      throw error;
    } finally {
      // Clean up test schema
      try {
        await closeAllConnections();
        
        // Drop the idempotency schema
        const cleanupPrisma = new PrismaClient({
          datasources: { db: { url: process.env.DATABASE_URL } },
        });
        
        try {
          await cleanupPrisma.$executeRaw`DROP SCHEMA IF EXISTS ${idempotencySchemaName} CASCADE`;
        } finally {
          await cleanupPrisma.$disconnect();
        }
      } catch (e) {
        console.warn('Could not clean up test schema:', e);
      }
    }
  });
  });

  describe('Schema Validation', () => {
    it('should validate the current schema against migrations', () => {
      try {
        // Run prisma validate to ensure schema matches migrations
        const result = execSync('npx prisma validate', { stdio: 'pipe' });
        expect(result.toString()).toContain('is valid');
      } catch (error) {
        console.error('Schema validation failed:', error);
        throw error;
      }
    });
  });

  describe('Seller Fields Migration', () => {
    it('should have applied seller fields to User model', async () => {
      // Create a test user with seller fields
      const userData = {
        email: generateUniqueEmail('seller-test'),
        name: 'Test Seller',
        password: 'password123',
        isSeller: true,
        sellerApproved: true,
        shopName: 'Test Shop',
        shopDescription: 'A test shop for migration testing',
        sellerBio: 'Test seller bio',
      };
      
      const user = await createTestUser(prisma, userData);

      // Verify seller fields were saved
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.isSeller).toBe(true);
      expect(user.sellerApproved).toBe(true);
      expect(user.shopName).toBe('Test Shop');
      expect(user.shopDescription).toBe('A test shop for migration testing');
      expect(user.sellerBio).toBe('Test seller bio');

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should have applied approved field to Product model', async () => {
      // Create a test user
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail('product-test'),
        name: 'Test User',
        password: 'password123',
      });

      // Create a product with approved field
      const product = await prisma.product.create({
        data: {
          title: 'Test Product for Migration',
          description: 'Testing approved field migration',
          price: 99.99,
          images: JSON.stringify(['test.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['test']),
          sellerId: user.id,
          approved: true,
        },
      });

      // Verify approved field was saved
      expect(product.approved).toBe(true);

      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Wishlist Migration', () => {
    it('should have created Wishlist model with correct relations', async () => {
      // Create test user and product
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail('wishlist-test'),
        name: 'Wishlist Test User',
        password: 'password123',
      });

      const product = await prisma.product.create({
        data: {
          title: 'Wishlist Test Product',
          description: 'Testing wishlist migration',
          price: 29.99,
          images: JSON.stringify(['wishlist.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['wishlist']),
          sellerId: user.id,
        },
      });

      // Create wishlist item
      const wishlist = await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: product.id,
        },
      });

      // Verify wishlist was created with correct relations
      expect(wishlist).toBeDefined();
      expect(wishlist.userId).toBe(user.id);
      expect(wishlist.productId).toBe(product.id);

      // Test unique constraint
      await expect(
        prisma.wishlist.create({
          data: {
            userId: user.id,
            productId: product.id,
          },
        })
      ).rejects.toThrow(); // Should throw due to unique constraint

      // Clean up
      await prisma.wishlist.delete({ where: { id: wishlist.id } });
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Review Migration', () => {
    it('should have created Review model with correct relations', async () => {
      // Create test users and product
      const reviewer = await createTestUser(prisma, {
        email: generateUniqueEmail('reviewer'),
        name: 'Review Test User',
        password: 'password123',
      });

      const seller = await createTestUser(prisma, {
        email: generateUniqueEmail('seller'),
        name: 'Review Test Seller',
        password: 'password123',
        isSeller: true,
      });

      const product = await prisma.product.create({
        data: {
          title: 'Review Test Product',
          description: 'Testing review migration',
          price: 39.99,
          images: JSON.stringify(['review.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['review']),
          sellerId: seller.id,
        },
      });

      // Create product review
      const productReview = await prisma.review.create({
        data: {
          rating: 5,
          comment: 'Great product!',
          productId: product.id,
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
        },
      });

      // Create seller review
      const sellerReview = await prisma.review.create({
        data: {
          rating: 4,
          comment: 'Good seller',
          sellerId: seller.id,
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
        },
      });

      // Verify product review was created with correct relations
      expect(productReview).toBeDefined();
      expect(productReview.productId).toBe(product.id);
      expect(productReview.reviewerId).toBe(reviewer.id);

      // Verify seller review was created with correct relations
      expect(sellerReview).toBeDefined();
      expect(sellerReview.sellerId).toBe(seller.id);
      expect(sellerReview.reviewerId).toBe(reviewer.id);

      // Clean up
      await prisma.review.deleteMany({
        where: {
          OR: [
            { id: productReview.id },
            { id: sellerReview.id }
          ]
        }
      });
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.deleteMany({
        where: {
          OR: [
            { id: reviewer.id },
            { id: seller.id }
          ]
        }
      });
    });
  });
});
