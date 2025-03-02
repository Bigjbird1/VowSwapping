// Script to create a pre-verified seller account
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create a new PrismaClient instance with explicit options
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function createSellerAccount() {
  const email = 'jdarsinos1@gmail.com';
  const password = 'Pleasework123!';
  const name = 'Jesse Darsinos';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists. Updating to verified status...');
      
      // First, update the user to have a verified email
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: new Date(),
        },
      });
      
      console.log('Email verified successfully!');
      
      // Check if seller fields exist in the schema
      let hasSellerFields = true;
      try {
        // Try to query a user with seller fields to see if they exist
        await prisma.$queryRaw`SELECT "isSeller" FROM "User" LIMIT 1`;
      } catch (error) {
        hasSellerFields = false;
        console.log('Seller fields not found in database schema. Migration may be needed.');
      }
      
      // If seller fields exist, update the user to be a seller
      if (hasSellerFields) {
        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              isSeller: true,
              sellerApproved: true,
              shopName: 'Jesse\'s Wedding Shop',
              shopDescription: 'High-quality wedding items at affordable prices.',
              sellerBio: 'I\'m passionate about helping couples find beautiful items for their special day.',
              sellerSince: new Date(),
            },
          });
          console.log('User updated to approved seller successfully!');
        } catch (error) {
          console.error('Error updating seller fields:', error);
          console.log('Please run: npx prisma migrate deploy');
        }
      }
      
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create basic user first
    const userData = {
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(), // Pre-verified
    };
    
    // Check if seller fields exist in the schema
    let hasSellerFields = true;
    try {
      // Try to query a user with seller fields to see if they exist
      await prisma.$queryRaw`SELECT "isSeller" FROM "User" LIMIT 1`;
    } catch (error) {
      hasSellerFields = false;
      console.log('Seller fields not found in database schema. Migration may be needed.');
    }
    
    // Add seller fields if they exist in the schema
    if (hasSellerFields) {
      userData.isSeller = true;
      userData.sellerApproved = true;
      userData.shopName = 'Jesse\'s Wedding Shop';
      userData.shopDescription = 'High-quality wedding items at affordable prices.';
      userData.sellerBio = 'I\'m passionate about helping couples find beautiful items for their special day.';
      userData.sellerSince = new Date();
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: userData,
    });

    console.log('User account created successfully!');
    console.log('User ID:', newUser.id);
    console.log('Email:', email);
    console.log('Password: [as provided]');
    
    if (hasSellerFields) {
      console.log('Seller Status: Approved');
    } else {
      console.log('Basic user created. Run migrations to add seller fields, then update user.');
    }
  } catch (error) {
    console.error('Error creating account:', error);
    console.log('If the error is related to missing fields, run: npx prisma migrate deploy');
  } finally {
    await prisma.$disconnect();
  }
}

createSellerAccount();
