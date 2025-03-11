// Script to create a pre-verified user account using direct SQL
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function createUserDirect() {
  const email = 'test@example.com';
  const password = 'Password123!';
  const name = 'Test User';
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Parse the DATABASE_URL to extract components
  const dbUrl = process.env.DATABASE_URL;
  console.log('Database URL:', dbUrl ? 'Found' : 'Not found');
  
  // Create a new PostgreSQL client with explicit parameters
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false // Ignore SSL certificate validation
    }
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');
    
    // Check if user already exists
    const checkUserQuery = 'SELECT id, "emailVerified" FROM "User" WHERE email = $1';
    const checkUserResult = await client.query(checkUserQuery, [email]);
    
    if (checkUserResult.rows.length > 0) {
      const userId = checkUserResult.rows[0].id;
      console.log(`User already exists with ID: ${userId}`);
      
      // Update the user to have a verified email if not already verified
      if (!checkUserResult.rows[0].emailVerified) {
        const verifyEmailQuery = 'UPDATE "User" SET "emailVerified" = NOW() WHERE id = $1';
        await client.query(verifyEmailQuery, [userId]);
        console.log('Email verified successfully');
      } else {
        console.log('Email already verified');
      }
      
      // Check if the seller fields exist in the database
      try {
        const checkSellerFieldsQuery = 'SELECT column_name FROM information_schema.columns WHERE table_name = \'User\' AND column_name = \'isSeller\'';
        const sellerFieldsResult = await client.query(checkSellerFieldsQuery);
        
        if (sellerFieldsResult.rows.length > 0) {
          console.log('Seller fields exist in the database');
          
          // Update the user to be a seller
          const updateSellerQuery = `
            UPDATE "User" 
            SET "isSeller" = true, 
                "sellerApproved" = true,
                "shopName" = $1,
                "shopDescription" = $2,
                "sellerBio" = $3,
                "sellerSince" = NOW()
            WHERE id = $4
          `;
          
          await client.query(updateSellerQuery, [
            'Jesse\'s Wedding Shop',
            'High-quality wedding items at affordable prices.',
            'I\'m passionate about helping couples find beautiful items for their special day.',
            userId
          ]);
          
          console.log('User updated to approved seller successfully');
        } else {
          console.log('Seller fields do not exist in the database. Migration needed.');
        }
      } catch (error) {
        console.error('Error checking seller fields:', error);
        console.log('Seller fields may not exist in the database. Migration needed.');
      }
    } else {
      // Create a new user
      const createUserQuery = `
        INSERT INTO "User" (
          id, name, email, password, "emailVerified", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, NOW(), NOW(), NOW()
        ) RETURNING id
      `;
      
      const createUserResult = await client.query(createUserQuery, [name, email, hashedPassword]);
      const userId = createUserResult.rows[0].id;
      
      console.log(`User created successfully with ID: ${userId}`);
      console.log(`Email: ${email}`);
      console.log('Password: [as provided]');
      
      // Check if the seller fields exist in the database
      try {
        const checkSellerFieldsQuery = 'SELECT column_name FROM information_schema.columns WHERE table_name = \'User\' AND column_name = \'isSeller\'';
        const sellerFieldsResult = await client.query(checkSellerFieldsQuery);
        
        if (sellerFieldsResult.rows.length > 0) {
          console.log('Seller fields exist in the database');
          
          // Update the user to be a seller
          const updateSellerQuery = `
            UPDATE "User" 
            SET "isSeller" = true, 
                "sellerApproved" = true,
                "shopName" = $1,
                "shopDescription" = $2,
                "sellerBio" = $3,
                "sellerSince" = NOW()
            WHERE id = $4
          `;
          
          await client.query(updateSellerQuery, [
            'Jesse\'s Wedding Shop',
            'High-quality wedding items at affordable prices.',
            'I\'m passionate about helping couples find beautiful items for their special day.',
            userId
          ]);
          
          console.log('User updated to approved seller successfully');
        } else {
          console.log('Seller fields do not exist in the database. Migration needed.');
        }
      } catch (error) {
        console.error('Error checking seller fields:', error);
        console.log('Seller fields may not exist in the database. Migration needed.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

createUserDirect();
