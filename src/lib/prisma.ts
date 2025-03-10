import { PrismaClient } from '@prisma/client';

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Generate a unique client ID to avoid prepared statement conflicts
const generateClientId = () => {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  prismaClientId?: string;
};

// Create a new PrismaClient instance with specific configuration
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('No database URL found. Please set DATABASE_URL environment variable.');
    return new PrismaClient();
  }
  
  // Generate a unique client ID for this PrismaClient instance
  const clientId = generateClientId();
  globalForPrisma.prismaClientId = clientId;
  
  console.log(`Creating PrismaClient with ID: ${clientId}`);
  
  // Safely log the database URL without exposing credentials
  if (databaseUrl.includes(':')) {
    console.log('Using database URL:', databaseUrl.substring(0, databaseUrl.indexOf(':') + 3) + '[REDACTED]');
  } else {
    console.log('Using database URL: [REDACTED]');
  }
  
  // Add connection pooling parameters to the connection string to avoid prepared statement conflicts
  let connectionUrl = databaseUrl;
  try {
    // Parse the URL to add or replace parameters
    const url = new URL(databaseUrl);
    const searchParams = new URLSearchParams(url.search);
    
    // Set connection pooling parameters
    searchParams.set('application_name', `vowswap_${clientId}`);
    searchParams.set('statement_cache_size', '0');
    searchParams.set('pool_timeout', '30');
    
    // Add SSL parameters if not already present
    if (!searchParams.has('sslmode')) {
      searchParams.set('sslmode', 'require');
    }
    
    // Reconstruct the URL with the updated search parameters
    url.search = searchParams.toString();
    connectionUrl = url.toString();
  } catch (error) {
    console.error('Error modifying connection URL:', error);
    // Fallback to simple string manipulation if URL parsing fails
    if (!connectionUrl.includes('application_name=')) {
      const separator = connectionUrl.includes('?') ? '&' : '?';
      connectionUrl = `${connectionUrl}${separator}application_name=vowswap_${clientId}&statement_cache_size=0&pool_timeout=30`;
    }
    
    // Add SSL parameters if not already present
    if (!connectionUrl.includes('sslmode=')) {
      const separator = connectionUrl.includes('?') ? '&' : '?';
      connectionUrl = `${connectionUrl}${separator}sslmode=require`;
    }
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: connectionUrl
  });
};

// Use existing PrismaClient if it exists, otherwise create a new one
export const prisma = globalForPrisma.prisma || createPrismaClient();

// If we're not in production, save PrismaClient on the global object
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
