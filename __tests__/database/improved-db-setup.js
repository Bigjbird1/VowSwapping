// Improved database test setup with better connection pooling
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { URL } = require('url');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Generate a unique session ID for this test run
const generateSessionId = () => `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
const sessionId = generateSessionId();
const schemaName = `test_${sessionId}`;

// Get test database URL with proper parameters
function getTestDbUrl() {
  // Start with the base URL
  const baseUrl = process.env.DATABASE_URL || 'postgres://postgres.ayuukerzreoiqevkhhlv:Letmeinplease123!jzd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
  
  try {
    const url = new URL(baseUrl);
    const searchParams = new URLSearchParams(url.search);
    
    // Set the schema parameter to our unique schema name
    searchParams.set('schema', schemaName);
    
    // Add connection pooling parameters to avoid prepared statement conflicts
    searchParams.set('application_name', `vowswap_test_${sessionId}`);
    searchParams.set('statement_cache_size', '0');
    searchParams.set('pool_timeout', '30');
    
    // Reconstruct the URL with the updated search parameters
    url.search = searchParams.toString();
    return url.toString();
  } catch (error) {
    console.error('Error parsing database URL:', error);
    return baseUrl;
  }
}

// Create a test schema
async function createTestSchema(testDbUrl) {
  console.log(`Creating test schema: ${schemaName}`);
  
  // Use a direct connection to create the schema
  const client = new Client({
    connectionString: testDbUrl,
    ssl: { rejectUnauthorized: false },
    application_name: `vowswap_schema_setup_${sessionId}`
  });
  
  try {
    await client.connect();
    console.log('Connected to database for schema setup');
    
    // Drop schema if it exists
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    console.log(`Dropped schema ${schemaName} if it existed`);
    
    // Create schema
    await client.query(`CREATE SCHEMA ${schemaName}`);
    console.log(`Created schema ${schemaName}`);
    
    // Set search path
    await client.query(`SET search_path TO ${schemaName}`);
    console.log(`Set search path to ${schemaName}`);
    
    // Verify schema was created
    const result = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);
    
    if (result.rows.length > 0) {
      console.log(`Schema ${schemaName} verified`);
      return true;
    } else {
      console.error(`Schema ${schemaName} not found after creation`);
      return false;
    }
  } catch (error) {
    console.error('Error creating test schema:', error);
    return false;
  } finally {
    await client.end();
    console.log('Closed schema setup connection');
  }
}

// Create a Prisma client for testing
function createPrismaClient(testDbUrl) {
  // Add SSL parameters to the URL if not already present
  let connectionUrl = testDbUrl;
  try {
    const url = new URL(testDbUrl);
    const searchParams = new URLSearchParams(url.search);
    
    // Add SSL parameters
    if (!searchParams.has('sslmode')) {
      searchParams.set('sslmode', 'require');
    }
    
    // Reconstruct the URL with the updated search parameters
    url.search = searchParams.toString();
    connectionUrl = url.toString();
  } catch (error) {
    console.error('Error modifying connection URL for SSL:', error);
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}

// Setup function for Jest
async function setup() {
  console.log('Setting up test database...');
  
  // Get test database URL
  const testDbUrl = getTestDbUrl();
  console.log(`Using test database URL: ${testDbUrl.substring(0, testDbUrl.indexOf(':') + 3)}[REDACTED]`);
  
  // Create a temporary .env.test file
  const envTestPath = path.join(process.cwd(), '.env.test');
  const envContent = `DATABASE_URL="${testDbUrl}"\nTEST_DATABASE_URL="${testDbUrl}"\n`;
  fs.writeFileSync(envTestPath, envContent);
  console.log('Created temporary .env.test file');
  
  // Create test schema
  const schemaCreated = await createTestSchema(testDbUrl);
  if (!schemaCreated) {
    throw new Error('Failed to create test schema');
  }
  
  // Create Prisma client
  const prisma = createPrismaClient(testDbUrl);
  
  // Connect to the database
  try {
    await prisma.$connect();
    console.log('Connected to test database with Prisma');
    
    // Test the connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test successful');
    
    // Return the Prisma client and test database URL
    return { prisma, testDbUrl, schemaName };
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
}

// Teardown function for Jest
async function teardown({ prisma, testDbUrl, schemaName }) {
  console.log('Tearing down test database...');
  
  try {
    // Disconnect Prisma client
    await prisma.$disconnect();
    console.log('Disconnected Prisma client');
    
    // Drop the test schema
    const client = new Client({
      connectionString: testDbUrl,
      ssl: { rejectUnauthorized: false },
      application_name: `vowswap_cleanup_${sessionId}`
    });
    
    await client.connect();
    console.log('Connected to database for cleanup');
    
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    console.log(`Dropped schema ${schemaName}`);
    
    await client.end();
    console.log('Closed cleanup connection');
    
    // Remove temporary .env.test file
    const envTestPath = path.join(process.cwd(), '.env.test');
    if (fs.existsSync(envTestPath)) {
      fs.unlinkSync(envTestPath);
      console.log('Removed temporary .env.test file');
    }
    
    console.log('Test database teardown complete');
  } catch (error) {
    console.error('Error during test database teardown:', error);
  }
}

module.exports = {
  setup,
  teardown,
  getTestDbUrl,
  createTestSchema,
  createPrismaClient,
  generateSessionId,
};
