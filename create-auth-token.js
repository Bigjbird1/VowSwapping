// Script to create an authentication token for a user
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function createAuthToken() {
  const email = 'jdarsinos1@gmail.com';
  
  // Parse the DATABASE_URL to extract components
  const dbUrl = process.env.DATABASE_URL;
  console.log('Database URL:', dbUrl ? 'Found' : 'Not found');
  
  // Create a new PostgreSQL pool with explicit parameters
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false // Ignore SSL certificate validation
    }
  });
  
  const client = await pool.connect();
  
  try {
    // Connect to the database
    console.log('Connected to the database');
    
    // Check if user exists
    const checkUserQuery = 'SELECT id, name, email, "emailVerified", "isSeller", "sellerApproved" FROM "User" WHERE email = $1';
    const checkUserResult = await client.query(checkUserQuery, [email]);
    
    if (checkUserResult.rows.length === 0) {
      console.log('User not found. Please create a user first using create-user-pg.js');
      return;
    }
    
    const user = checkUserResult.rows[0];
    console.log('User found:', user);
    
    // Create a JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-key-change-in-production'
    );
    
    console.log('Authentication token created successfully!');
    console.log('Token:', token);
    
    // Instructions for using the token
    console.log('\n=== INSTRUCTIONS ===');
    console.log('To use this token:');
    console.log('1. Open your browser\'s developer tools (F12)');
    console.log('2. Go to the Application tab');
    console.log('3. Under Storage, select Cookies, then select your site (http://localhost:3000)');
    console.log('4. Add a new cookie with the following details:');
    console.log('   Name: next-auth.session-token');
    console.log(`   Value: ${token}`);
    console.log('   Path: /');
    console.log('5. Refresh the page');
    console.log('You should now be logged in as', user.email);
    console.log('=== END INSTRUCTIONS ===\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    client.release();
    await pool.end();
    console.log('Database connection closed');
  }
}

createAuthToken();
