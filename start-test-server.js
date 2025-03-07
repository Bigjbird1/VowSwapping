const { execSync } = require('child_process');
const { spawn } = require('child_process');
require('dotenv').config();

console.log('Starting test server on port 3002...');

// Apply migrations to ensure database is up to date
try {
  console.log('Applying database migrations...');
  execSync('npx prisma db push', { stdio: 'inherit' });
} catch (error) {
  console.error('Error applying migrations:', error.message);
  console.log('Continuing with server startup...');
}

// Start the Next.js development server on port 3002
const server = spawn('npx', ['next', 'dev', '-p', '3002'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
});

// Handle server process events
server.on('error', (error) => {
  console.error('Failed to start test server:', error);
  process.exit(1);
});

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('Shutting down test server...');
  server.kill('SIGINT');
  process.exit(0);
});

console.log('Test server running on http://localhost:3002');
