import { PrismaClient } from '@prisma/client';

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a new PrismaClient instance with specific configuration
const createPrismaClient = () => {
  // Use DATABASE_URL if available, otherwise fall back to Supabase's POSTGRES_PRISMA_URL
  let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.error('No database URL found. Please set DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL environment variable.');
    return new PrismaClient();
  }
  
  // Ensure the URL starts with postgresql:// or postgres://
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    // If it doesn't have the protocol, add postgresql://
    if (databaseUrl.includes('@') && databaseUrl.includes('/')) {
      databaseUrl = 'postgresql://' + databaseUrl.split('@')[1];
    } else {
      // If we can't parse it, prepend postgresql:// as a fallback
      databaseUrl = 'postgresql://' + databaseUrl;
    }
    console.log('Modified database URL to ensure it has the correct protocol prefix');
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

// Use existing PrismaClient if it exists, otherwise create a new one
export const prisma = globalForPrisma.prisma || createPrismaClient();

// If we're not in production, save PrismaClient on the global object
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
