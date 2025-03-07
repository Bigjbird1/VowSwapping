const { execSync } = require('child_process');
const { Client } = require('pg');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL
  });

  try {
    await client.connect();
    
    // Drop and recreate schema
    await client.query('DROP SCHEMA IF EXISTS test CASCADE');
    await client.query('CREATE SCHEMA test');
    await client.query('SET search_path TO test');
    
    console.log('Test database connection successful');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  } finally {
    await client.end();
  }
}

module.exports = async () => {
  try {
    // Set environment variable for test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    // Setup database schema
    const setupSuccess = await setupDatabase();
    if (!setupSuccess) {
      throw new Error('Failed to setup test database');
    }

    // Apply Prisma migrations
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: 'true'
      },
      stdio: 'inherit'
    });

    return true;
  } catch (error) {
    console.error('Failed to ensure test schema:', error);
    throw error;
  }
};

// Cleanup function
module.exports.cleanup = async () => {
  try {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL
    });
    await client.connect();
    await client.query('DROP SCHEMA IF EXISTS test CASCADE');
    await client.end();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};
