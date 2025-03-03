const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const migrationFile = path.join(__dirname, 'prisma/migrations/20250302_add_wishlist_model/migration.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

// Create a temporary file with the SQL
const tempFile = path.join(__dirname, 'temp-migration.sql');
fs.writeFileSync(tempFile, migrationSQL);

try {
  // Execute the SQL using the DATABASE_URL from .env
  console.log('Applying Wishlist migration...');
  execSync(`psql "${process.env.DATABASE_URL}" -f ${tempFile}`, { stdio: 'inherit' });
  console.log('Migration applied successfully!');
} catch (error) {
  console.error('Error applying migration:', error.message);
} finally {
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
}
