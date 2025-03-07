const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Applying Wishlist migration...');

try {
  // Use Prisma to apply the migration
  console.log('Using Prisma to apply migration...');
  execSync('npx prisma migrate dev --name add_wishlist_model', { 
    stdio: 'inherit',
    env: process.env
  });
  console.log('Migration applied successfully!');
} catch (error) {
  console.error('Error applying migration:', error.message);
  console.log('Attempting alternative method...');
  
  try {
    // Alternative method: use prisma db push
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: process.env
    });
    console.log('Schema pushed successfully!');
  } catch (pushError) {
    console.error('Error pushing schema:', pushError.message);
  }
}
