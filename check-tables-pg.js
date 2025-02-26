const { Pool } = require('pg');
require('dotenv').config();

// Parse the DATABASE_URL
const connectionString = process.env.DATABASE_URL;
console.log('Database URL:', connectionString ? 'Found' : 'Not found');

try {
  console.log('Creating database pool...');
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  async function checkTables() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database successfully!');
  
  try {
    console.log('Checking if tables exist in the database...');
    
    // Check if User table exists
    const userTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'User'
      );
    `);
    
    // Check if Product table exists
    const productTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Product'
      );
    `);
    
    // Check if Order table exists
    const orderTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Order'
      );
    `);
    
    console.log('User table exists:', userTableResult.rows[0].exists);
    console.log('Product table exists:', productTableResult.rows[0].exists);
    console.log('Order table exists:', orderTableResult.rows[0].exists);
    
    // List all tables in the database
    const allTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('All tables in the database:');
    allTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

  checkTables()
    .then(() => {
      console.log('Table check completed.');
    })
    .catch(e => {
      console.error('Unexpected error:', e);
      process.exit(1);
    });
} catch (error) {
  console.error('Error setting up database connection:', error);
}
