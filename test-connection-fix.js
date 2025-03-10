// Enhanced test database connection script with improved connection pooling
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Generate a unique session ID for this test run
const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
const schemaName = `test_${sessionId}`;

// Define database URL with schema parameter
function getTestDbUrl() {
  // Start with the base URL
  const baseUrl = process.env.DATABASE_URL || 'postgres://postgres.ayuukerzreoiqevkhhlv:Letmeinplease123!jzd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
  
  // Parse the URL to add or replace the schema parameter
  try {
    const url = new URL(baseUrl);
    const searchParams = new URLSearchParams(url.search);
    
    // Set the schema parameter to our unique schema name
    searchParams.set('schema', schemaName);
    
    // Add connection pooling parameters to avoid prepared statement conflicts
    searchParams.set('application_name', `vowswap_${sessionId}`);
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

async function setupTestSchema() {
  console.log(`Setting up test schema: ${schemaName}`);
  
  // Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  // Create a temporary .env.test file with the test database URL
  const testDbUrl = getTestDbUrl();
  
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
  
  const envContent = `DATABASE_URL="${connectionUrl}"\nTEST_DATABASE_URL="${connectionUrl}"\n`;
  
  fs.writeFileSync('.env.test', envContent);
  console.log('Created temporary .env.test file');
  
  // Use a direct connection to create the schema
  const { Client } = require('pg');
  const client = new Client({
    connectionString: connectionUrl,
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
    } else {
      throw new Error(`Schema ${schemaName} not found after creation`);
    }
  } finally {
    await client.end();
    console.log('Closed schema setup connection');
  }
  
  return testDbUrl;
}

async function pushPrismaSchema(testDbUrl) {
  console.log('Pushing Prisma schema to database...');
  
  try {
    // Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
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
    
    // Use environment variables to configure Prisma
    const env = {
      ...process.env,
      DATABASE_URL: connectionUrl,
      TEST_DATABASE_URL: connectionUrl,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: 'true',
      PRISMA_CLIENT_ENGINE_TYPE: 'binary',
      PRISMA_ENGINE_PROTOCOL: 'json',
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    };
    
    // Push the schema
    execSync('npx prisma db push --skip-generate', { 
      env,
      stdio: 'inherit'
    });
    
    console.log('Prisma schema pushed successfully');
  } catch (error) {
    console.error('Error pushing Prisma schema:', error);
    throw error;
  }
}

async function testConnection(testDbUrl) {
  console.log('Testing database connection with PrismaClient...');
  
  // Create a new PrismaClient instance with the test database URL
  // Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
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
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('PrismaClient connection successful');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
    // Create a test user
    const email = `test-${Math.random().toString(36).substring(2, 15)}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        password: 'password123',
      },
    });
    console.log('Test user created:', user.id);
    
    // Retrieve the user
    const retrievedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    console.log('Retrieved user:', retrievedUser.id, retrievedUser.email);
    
    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Test user deleted');
    
    console.log('All connection tests passed!');
    return true;
  } catch (error) {
    console.error('Error testing database connection:', error);
    throw error;
  } finally {
    // Disconnect
    await prisma.$disconnect();
    console.log('Disconnected PrismaClient');
  }
}

async function cleanup() {
  console.log('Cleaning up test resources...');
  
  try {
    // Remove temporary .env.test file
    if (fs.existsSync('.env.test')) {
      fs.unlinkSync('.env.test');
      console.log('Removed temporary .env.test file');
    }
    
    // Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Drop the test schema
    const testDbUrl = getTestDbUrl();
    
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
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: connectionUrl,
      ssl: { rejectUnauthorized: false },
      application_name: `vowswap_cleanup_${sessionId}`
    });
    
    await client.connect();
    console.log('Connected to database for cleanup');
    
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    console.log(`Dropped schema ${schemaName}`);
    
    await client.end();
    console.log('Closed cleanup connection');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting enhanced database connection test');
    console.log(`Session ID: ${sessionId}`);
    
    // Setup test schema
    const testDbUrl = await setupTestSchema();
    
    // Push Prisma schema
    await pushPrismaSchema(testDbUrl);
    
    // Test connection
    await testConnection(testDbUrl);
    
    console.log('Database connection test completed successfully');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    // Always clean up
    await cleanup();
  }
}

// Run the main function
if (require.main === module) {
  main()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = {
  getTestDbUrl,
  setupTestSchema,
  pushPrismaSchema,
  testConnection,
  cleanup,
  main
};
