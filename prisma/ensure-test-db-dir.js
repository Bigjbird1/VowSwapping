// Script to ensure the test database directory exists
const fs = require('fs');
const path = require('path');

// Define test database directory path
const TEST_DB_DIR = path.join(process.cwd(), 'prisma');

// Create the directory if it doesn't exist
if (!fs.existsSync(TEST_DB_DIR)) {
  console.log(`Creating test database directory: ${TEST_DB_DIR}`);
  fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  console.log('Test database directory created successfully');
} else {
  console.log(`Test database directory already exists: ${TEST_DB_DIR}`);
}

// Check if we can write to the directory
try {
  const testFile = path.join(TEST_DB_DIR, '.test-write');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('Directory is writable');
} catch (error) {
  console.error('Error writing to directory:', error);
  process.exit(1);
}

console.log('Test database directory setup complete');
