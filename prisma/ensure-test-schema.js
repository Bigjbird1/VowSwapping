const { execSync } = require('child_process');
const { Client } = require('pg');
const { URL } = require('url');
const dotenv = require('dotenv');

// Generate a unique client ID to avoid prepared statement conflicts
const clientId = `schema_setup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// Load environment variables from .env file
dotenv.config();

console.log('Environment variables loaded');
console.log('TEST_DATABASE_URL:', process.env.TEST_DATABASE_URL ? 'Found' : 'Not found');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
console.log('Using client ID:', clientId);

// Extract schema from connection string or use default with timestamp for uniqueness
function getSchemaFromUrl(connectionString) {
  if (!connectionString) {
    console.error('Connection string is undefined');
    const defaultSchema = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Using generated schema name: ${defaultSchema}`);
    return defaultSchema;
  }
  
  try {
    const url = new URL(connectionString);
    const params = new URLSearchParams(url.search);
    const schema = params.get('schema') || `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Using schema from URL or generated: ${schema}`);
    return schema;
  } catch (error) {
    console.error('Error parsing connection string:', error);
    const defaultSchema = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Using generated schema name after error: ${defaultSchema}`);
    return defaultSchema;
  }
}

async function setupDatabase() {
  // Use TEST_DATABASE_URL if available, otherwise fall back to DATABASE_URL
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('No database connection string available');
    return false;
  }
  
  const schema = getSchemaFromUrl(connectionString);
  
  console.log(`Using connection string: ${connectionString.substring(0, connectionString.indexOf(':') + 3)}[REDACTED]`);
  console.log(`Using schema: ${schema}`);
  
  // Disable SSL verification for testing
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  // Add application_name with client ID to avoid prepared statement conflicts
  const clientOptions = {
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    application_name: `vowswap_test_${clientId}`
  };
  
  console.log(`Using application_name: ${clientOptions.application_name}`);
  
  const client = new Client(clientOptions);

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database');
    
    // Drop and recreate schema
    console.log(`Dropping schema if exists: ${schema}`);
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    
    console.log(`Creating schema: ${schema}`);
    await client.query(`CREATE SCHEMA ${schema}`);
    
    console.log(`Setting search path to: ${schema}`);
    await client.query(`SET search_path TO ${schema}`);
    
    // Verify schema was created
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schema]);
    
    if (schemaCheck.rows.length > 0) {
      console.log(`Schema ${schema} verified`);
    } else {
      console.error(`Schema ${schema} not found after creation`);
      return false;
    }
    
    console.log('Test database connection successful');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  } finally {
    try {
      console.log('Closing database connection');
      await client.end();
      console.log('Database connection closed');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }
}

module.exports = async () => {
  try {
    // Set environment variable for test database
    if (process.env.TEST_DATABASE_URL) {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      console.log('Using TEST_DATABASE_URL for Prisma');
    } else {
      console.log('TEST_DATABASE_URL not found, using DATABASE_URL');
    }

    // Setup database schema
    console.log('Setting up database schema...');
    const setupSuccess = await setupDatabase();
    if (!setupSuccess) {
      throw new Error('Failed to setup test database');
    }

    // Apply Prisma migrations with unique client ID
    console.log('Applying Prisma migrations...');
    try {
      execSync('npx prisma migrate reset --force --skip-seed', {
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: 'true',
          PRISMA_CLIENT_ENGINE_TYPE: 'binary',
          PRISMA_ENGINE_PROTOCOL: 'json',
          PRISMA_CLIENT_ENGINE_ID: clientId
        },
        stdio: 'inherit'
      });
      console.log('Prisma migrations applied successfully');
    } catch (migrationError) {
      console.error('Error applying Prisma migrations:', migrationError);
      throw migrationError;
    }

    console.log('Test schema setup complete');
    return true;
  } catch (error) {
    console.error('Failed to ensure test schema:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
};

// Cleanup function
module.exports.cleanup = async () => {
  try {
    console.log('Starting cleanup...');
    const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    const schema = getSchemaFromUrl(connectionString);
    
    // Disable SSL verification for testing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Add application_name with client ID to avoid prepared statement conflicts
    const cleanupClientId = `cleanup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      application_name: `vowswap_cleanup_${cleanupClientId}`
    });
    
    console.log(`Connecting to database for cleanup with client ID: ${cleanupClientId}`);
    await client.connect();
    console.log(`Connected to database for cleanup`);
    
    console.log(`Dropping schema: ${schema}`);
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    
    console.log(`Closing database connection`);
    await client.end();
    console.log(`Database connection closed`);
    
    console.log(`Cleaned up schema: ${schema}`);
  } catch (error) {
    console.error('Cleanup error:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
};
