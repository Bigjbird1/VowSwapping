// Script to reset the database and apply migrations cleanly
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

console.log('Resetting database and applying migrations...');

// Reset the test schema in PostgreSQL
async function resetTestSchema() {
  const TEST_SCHEMA = 'test';
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:Letmeinplease123!jzd@ayuukerzreoiqevkhhlv.supabase.co:5432/postgres',
      },
    },
  });
  
  try {
    console.log(`Resetting schema '${TEST_SCHEMA}'...`);
    
    // Drop the schema if it exists
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`;
    console.log(`Schema '${TEST_SCHEMA}' dropped`);
    
    // Create the schema
    await prisma.$executeRaw`CREATE SCHEMA ${TEST_SCHEMA}`;
    
    // Grant necessary permissions
    await prisma.$executeRaw`GRANT ALL ON SCHEMA ${TEST_SCHEMA} TO postgres`;
    await prisma.$executeRaw`GRANT ALL ON ALL TABLES IN SCHEMA ${TEST_SCHEMA} TO postgres`;
    await prisma.$executeRaw`GRANT ALL ON ALL SEQUENCES IN SCHEMA ${TEST_SCHEMA} TO postgres`;
    await prisma.$executeRaw`GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${TEST_SCHEMA} TO postgres`;
    
    console.log(`Schema '${TEST_SCHEMA}' recreated successfully`);
  } catch (error) {
    console.error('Error resetting test schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the schema reset
resetTestSchema().catch(error => {
  console.error('Failed to reset schema:', error);
  process.exit(1);
});

// Run Prisma migrations
try {
  console.log('Applying migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Migrations applied successfully!');
} catch (error) {
  console.error('Error applying migrations:', error.message);
  process.exit(1);
}

// Generate Prisma client
try {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma client:', error.message);
  process.exit(1);
}

console.log('Database reset and migrations applied successfully!');
