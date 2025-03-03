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
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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
