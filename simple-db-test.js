// Simple database connection test
const { PrismaClient } = require('@prisma/client');

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification in development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use the correct connection string
const connectionStrings = [
  'postgres://postgres.ayuukerzreoiqevkhhlv:Letmeinplease123!jzd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x'
];

async function testConnection(url) {
  console.log(`Testing connection to: ${url}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
    log: ['query', 'error', 'warn'],
  });
  
  try {
    // Test the connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connection successful!');
    
    // Test a simple query
    console.log('Testing query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
    console.log('Connection test passed!');
    return true;
  } catch (error) {
    console.error('Connection test failed with error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

async function main() {
  let success = false;
  
  for (const url of connectionStrings) {
    console.log('\n-----------------------------------');
    console.log(`Testing connection string: ${url}`);
    console.log('-----------------------------------\n');
    
    if (await testConnection(url)) {
      console.log(`\n✅ Successfully connected using: ${url}\n`);
      success = true;
      break;
    } else {
      console.log(`\n❌ Failed to connect using: ${url}\n`);
    }
  }
  
  if (!success) {
    console.error('\n❌ All connection attempts failed\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
