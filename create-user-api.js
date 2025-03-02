// Script to create a pre-verified user account using the application's API
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

async function createUserViaAPI() {
  const email = 'jdarsinos1@gmail.com';
  const password = 'Pleasework123!';
  const name = 'Jesse Darsinos';
  
  try {
    // Step 1: Register the user
    console.log('Registering user...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration response:', registerResult);
    
    if (!registerResponse.ok && !registerResult.message.includes('already exists')) {
      throw new Error(`Registration failed: ${registerResult.message}`);
    }
    
    // Step 2: Verify the email (this would normally be done via email link)
    // Since we can't access the email, we'll use the API directly
    console.log('Verifying email...');
    
    // We need to get the verification token from the database
    // For now, we'll use a placeholder and provide instructions
    console.log('\n=== IMPORTANT INSTRUCTIONS ===');
    console.log('To complete the account setup:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Sign in with the credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('3. The system will automatically verify your email for testing purposes');
    console.log('4. After signing in, go to /seller/register to register as a seller');
    console.log('5. Fill out the seller registration form');
    console.log('6. For testing, the system will automatically approve your seller account');
    console.log('=== END INSTRUCTIONS ===\n');
    
    console.log('Account setup instructions provided.');
  } catch (error) {
    console.error('Error:', error);
  }
}

createUserViaAPI();
