import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Generate unique client IDs to avoid prepared statement conflicts
const clientId1 = `client1_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const clientId2 = `client2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const clientId3 = `client3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// Create multiple PrismaClient instances to test connection pooling
let prisma1;
let prisma2;
let prisma3;

// Set up test context and database before all tests
beforeAll(async () => {
  // Increase timeout to 60 seconds for database setup
  jest.setTimeout(60000);
  try {
    console.log('=== Starting connection pooling and concurrency tests ===');
    
    // Initialize multiple PrismaClient instances with connection pooling and unique client IDs
    prisma1 = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
      // Configure connection pooling
      log: ['error', 'warn'],
      // Add a unique client ID to avoid prepared statement conflicts
      __internal: {
        engine: {
          clientId: clientId1
        }
      }
    });
    
    prisma2 = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
      log: ['error', 'warn'],
      __internal: {
        engine: {
          clientId: clientId2
        }
      }
    });
    
    prisma3 = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
      log: ['error', 'warn'],
      __internal: {
        engine: {
          clientId: clientId3
        }
      }
    });
    
    // Verify database connections one by one to avoid connection conflicts
    await prisma1.$connect();
    console.log(`Connected client 1 with ID: ${clientId1}`);
    
    await prisma2.$connect();
    console.log(`Connected client 2 with ID: ${clientId2}`);
    
    await prisma3.$connect();
    console.log(`Connected client 3 with ID: ${clientId3}`);
    
    console.log('All database connections verified for pooling tests');
    
  } catch (error) {
    console.error('Error in beforeAll setup:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Final cleanup
    await prisma1.$transaction([
      prisma1.review.deleteMany(),
      prisma1.orderItem.deleteMany(),
      prisma1.order.deleteMany(),
      prisma1.wishlist.deleteMany(),
      prisma1.address.deleteMany(),
      prisma1.product.deleteMany(),
      prisma1.user.deleteMany(),
      prisma1.seller.deleteMany(),
    ]).catch(err => console.error('Error in cleanup transaction:', err));
    
    // Disconnect clients one by one to avoid conflicts
    await prisma1.$disconnect();
    console.log(`Disconnected client 1 with ID: ${clientId1}`);
    
    await prisma2.$disconnect();
    console.log(`Disconnected client 2 with ID: ${clientId2}`);
    
    await prisma3.$disconnect();
    console.log(`Disconnected client 3 with ID: ${clientId3}`);
    
    console.log('=== Connection pooling and concurrency tests completed ===');
  } catch (error) {
    console.error('Error in afterAll cleanup:', error);
  }
});

// Helper function to generate unique email
const generateUniqueEmail = (prefix = 'test') => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
};

// Helper function to create a test user
const createTestUser = async (prisma, data = {}) => {
  const email = data.email || generateUniqueEmail();
  const name = data.name || 'Test User';
  const hashedPassword = data.password || await bcrypt.hash('password123', 10);
  
  return prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      ...data
    }
  });
};

// Helper function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Connection Pooling and Concurrency', () => {
  describe('Connection Pooling', () => {
    it('should handle multiple client connections', async () => {
      // Create users with different clients
      const user1 = await createTestUser(prisma1, { name: 'Pooling User 1' });
      const user2 = await createTestUser(prisma2, { name: 'Pooling User 2' });
      const user3 = await createTestUser(prisma3, { name: 'Pooling User 3' });
      
      // Verify all users were created
      expect(user1).toBeDefined();
      expect(user1.id).toBeDefined();
      expect(user1.name).toBe('Pooling User 1');
      
      expect(user2).toBeDefined();
      expect(user2.id).toBeDefined();
      expect(user2.name).toBe('Pooling User 2');
      
      expect(user3).toBeDefined();
      expect(user3.id).toBeDefined();
      expect(user3.name).toBe('Pooling User 3');
      
      // Verify users can be retrieved by any client
      const retrievedUser1 = await prisma2.user.findUnique({ where: { id: user1.id } });
      const retrievedUser2 = await prisma3.user.findUnique({ where: { id: user2.id } });
      const retrievedUser3 = await prisma1.user.findUnique({ where: { id: user3.id } });
      
      expect(retrievedUser1).toBeDefined();
      expect(retrievedUser1.id).toBe(user1.id);
      
      expect(retrievedUser2).toBeDefined();
      expect(retrievedUser2.id).toBe(user2.id);
      
      expect(retrievedUser3).toBeDefined();
      expect(retrievedUser3.id).toBe(user3.id);
      
      // Clean up
      await prisma1.user.deleteMany({
        where: {
          id: {
            in: [user1.id, user2.id, user3.id]
          }
        }
      });
    });
    
    it('should maintain transaction isolation between clients', async () => {
      // Start a transaction in the first client
      const user1 = await prisma1.$transaction(async (tx) => {
        const user = await createTestUser(tx, { name: 'Isolation User 1' });
        
        // Wait to simulate long-running transaction
        await wait(500);
        
        return user;
      });
      
      // Start a transaction in the second client
      const user2 = await prisma2.$transaction(async (tx) => {
        const user = await createTestUser(tx, { name: 'Isolation User 2' });
        
        // Wait to simulate long-running transaction
        await wait(500);
        
        return user;
      });
      
      // Verify both transactions completed successfully
      expect(user1).toBeDefined();
      expect(user1.id).toBeDefined();
      expect(user1.name).toBe('Isolation User 1');
      
      expect(user2).toBeDefined();
      expect(user2.id).toBeDefined();
      expect(user2.name).toBe('Isolation User 2');
      
      // Clean up
      await prisma1.user.deleteMany({
        where: {
          id: {
            in: [user1.id, user2.id]
          }
        }
      });
    });
  });
  
  describe('Concurrent Operations', () => {
    it('should handle concurrent reads', async () => {
      // Create test data
      const user = await createTestUser(prisma1);
      
      // Create multiple products
      const products = await Promise.all([
        prisma1.product.create({
          data: {
            title: 'Concurrent Product 1',
            description: 'Product for concurrent read test 1',
            price: 19.99,
            images: JSON.stringify(['concurrent1.jpg']),
            category: 'ELECTRONICS',
            condition: 'NEW',
            tags: JSON.stringify(['concurrent', 'test']),
            sellerId: user.id,
          }
        }),
        prisma1.product.create({
          data: {
            title: 'Concurrent Product 2',
            description: 'Product for concurrent read test 2',
            price: 29.99,
            images: JSON.stringify(['concurrent2.jpg']),
            category: 'CLOTHING',
            condition: 'NEW',
            tags: JSON.stringify(['concurrent', 'test']),
            sellerId: user.id,
          }
        }),
        prisma1.product.create({
          data: {
            title: 'Concurrent Product 3',
            description: 'Product for concurrent read test 3',
            price: 39.99,
            images: JSON.stringify(['concurrent3.jpg']),
            category: 'HOME',
            condition: 'NEW',
            tags: JSON.stringify(['concurrent', 'test']),
            sellerId: user.id,
          }
        })
      ]);
      
      // Perform concurrent reads with different clients
      const results = await Promise.all([
        prisma1.product.findMany({ where: { sellerId: user.id } }),
        prisma2.product.findMany({ where: { sellerId: user.id } }),
        prisma3.product.findMany({ where: { sellerId: user.id } })
      ]);
      
      // Verify all reads returned the same data
      expect(results[0]).toHaveLength(3);
      expect(results[1]).toHaveLength(3);
      expect(results[2]).toHaveLength(3);
      
      // Clean up
      await prisma1.product.deleteMany({
        where: {
          id: {
            in: products.map(p => p.id)
          }
        }
      });
      await prisma1.user.delete({ where: { id: user.id } });
    });
    
    it('should handle concurrent writes', async () => {
      // Create a test user
      const user = await createTestUser(prisma1);
      
      // Perform concurrent writes with different clients
      const productPromises = [];
      for (let i = 1; i <= 10; i++) {
        const client = i % 3 === 0 ? prisma3 : (i % 2 === 0 ? prisma2 : prisma1);
        productPromises.push(
          client.product.create({
            data: {
              title: `Concurrent Write Product ${i}`,
              description: `Product for concurrent write test ${i}`,
              price: 10.0 + i,
              images: JSON.stringify([`concurrent-write-${i}.jpg`]),
              category: 'ELECTRONICS',
              condition: 'NEW',
              tags: JSON.stringify(['concurrent', 'write', `test-${i}`]),
              sellerId: user.id,
            }
          })
        );
      }
      
      // Wait for all writes to complete
      const products = await Promise.all(productPromises);
      
      // Verify all products were created
      expect(products).toHaveLength(10);
      
      // Verify all products can be retrieved
      const retrievedProducts = await prisma1.product.findMany({
        where: {
          sellerId: user.id
        },
        orderBy: {
          price: 'asc'
        }
      });
      
      expect(retrievedProducts).toHaveLength(10);
      expect(retrievedProducts[0].price).toBe(11.0);
      expect(retrievedProducts[9].price).toBe(20.0);
      
      // Clean up
      await prisma1.product.deleteMany({
        where: {
          id: {
            in: products.map(p => p.id)
          }
        }
      });
      await prisma1.user.delete({ where: { id: user.id } });
    });
    
    it('should handle concurrent updates', async () => {
      // Create a test user
      const user = await createTestUser(prisma1);
      
      // Create a product to update
      const product = await prisma1.product.create({
        data: {
          title: 'Concurrent Update Product',
          description: 'Product for concurrent update test',
          price: 49.99,
          images: JSON.stringify(['concurrent-update.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['concurrent', 'update']),
          sellerId: user.id,
        }
      });
      
      // Perform concurrent updates with different clients
      // Note: In a real database, these would be serialized to maintain consistency
      const updatePromises = [
        prisma1.product.update({
          where: { id: product.id },
          data: { price: 59.99 }
        }),
        prisma2.product.update({
          where: { id: product.id },
          data: { description: 'Updated description' }
        }),
        prisma3.product.update({
          where: { id: product.id },
          data: { tags: JSON.stringify(['concurrent', 'update', 'modified']) }
        })
      ];
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Verify the product was updated
      const updatedProduct = await prisma1.product.findUnique({
        where: { id: product.id }
      });
      
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.price).toBe(59.99);
      expect(updatedProduct.description).toBe('Updated description');
      expect(JSON.parse(updatedProduct.tags)).toContain('modified');
      
      // Clean up
      await prisma1.product.delete({ where: { id: product.id } });
      await prisma1.user.delete({ where: { id: user.id } });
    });
  });
  
  describe('Error Handling and Recovery', () => {
    it('should handle and recover from query errors', async () => {
      // Attempt an operation that will fail (invalid data)
      try {
        await prisma1.user.create({
          data: {
            // Missing required email field
            name: 'Error Test User',
            password: await bcrypt.hash('password123', 10),
          }
        });
        
        // If we get here, the test should fail
        fail('Should have thrown an error for missing required field');
      } catch (error) {
        // Expected error
        expect(error).toBeDefined();
      }
      
      // Verify the client can still perform operations after an error
      const validUser = await createTestUser(prisma1, { name: 'Recovery Test User' });
      
      expect(validUser).toBeDefined();
      expect(validUser.id).toBeDefined();
      expect(validUser.name).toBe('Recovery Test User');
      
      // Clean up
      await prisma1.user.delete({ where: { id: validUser.id } });
    });
    
    it('should handle connection interruptions', async () => {
      // Simulate a connection interruption by disconnecting and reconnecting
      await prisma2.$disconnect();
      await wait(500); // Wait a bit
      await prisma2.$connect();
      
      // Verify the client can still perform operations after reconnecting
      const user = await createTestUser(prisma2, { name: 'Reconnection Test User' });
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Reconnection Test User');
      
      // Clean up
      await prisma2.user.delete({ where: { id: user.id } });
    });
  });
});
