import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Create a new instance of PrismaClient for testing
let prisma;

// Set up test context and database before all tests
beforeAll(async () => {
  // Increase timeout to 60 seconds for database setup
  jest.setTimeout(60000);
  try {
    console.log('=== Starting transaction and cascade tests ===');
    
    // Initialize the test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL
        }
      }
    });
    
    // Verify database connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT current_database()`;
    console.log('Database connection verified for transaction tests');
    
  } catch (error) {
    console.error('Error in beforeAll setup:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Final cleanup
    await prisma.$transaction([
      prisma.review.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.wishlist.deleteMany(),
      prisma.address.deleteMany(),
      prisma.product.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    
    await prisma.$disconnect();
    console.log('=== Transaction and cascade tests completed ===');
  } catch (error) {
    console.error('Error in afterAll cleanup:', error);
  }
});

// Helper function to generate unique email
const generateUniqueEmail = (prefix = 'test') => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
};

// Helper function to create a test user
const createTestUser = async (data = {}) => {
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

describe('Transaction and Cascade Operations', () => {
  describe('Transaction Tests', () => {
    it('should commit all operations in a successful transaction', async () => {
      // Arrange
      const email = generateUniqueEmail('transaction');
      
      // Act - Create user and product in a transaction
      const [user, product] = await prisma.$transaction([
        prisma.user.create({
          data: {
            email,
            name: 'Transaction User',
            password: await bcrypt.hash('password123', 10),
          }
        }),
        prisma.product.create({
          data: {
            title: 'Transaction Product',
            description: 'Product created in a transaction',
            price: 99.99,
            images: JSON.stringify(['transaction.jpg']),
            category: 'ELECTRONICS',
            condition: 'NEW',
            tags: JSON.stringify(['transaction', 'test']),
          }
        })
      ]);
      
      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      
      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.title).toBe('Transaction Product');
      
      // Verify both records exist in the database
      const foundUser = await prisma.user.findUnique({ where: { id: user.id } });
      const foundProduct = await prisma.product.findUnique({ where: { id: product.id } });
      
      expect(foundUser).toBeDefined();
      expect(foundProduct).toBeDefined();
      
      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.product.delete({ where: { id: product.id } });
    });
    
    it('should roll back all operations if a transaction fails', async () => {
      // Arrange
      const email = generateUniqueEmail('rollback');
      
      // Create a user with the same email first to cause a conflict
      const existingUser = await prisma.user.create({
        data: {
          email,
          name: 'Existing User',
          password: await bcrypt.hash('password123', 10),
        }
      });
      
      // Act & Assert - Try to create another user with the same email in a transaction
      try {
        await prisma.$transaction([
          prisma.product.create({
            data: {
              title: 'Rollback Product',
              description: 'This product should not be created',
              price: 49.99,
              images: JSON.stringify(['rollback.jpg']),
              category: 'HOME',
              condition: 'NEW',
              tags: JSON.stringify(['rollback', 'test']),
            }
          }),
          prisma.user.create({
            data: {
              email, // Same email as existing user - will cause an error
              name: 'Rollback User',
              password: await bcrypt.hash('password123', 10),
            }
          })
        ]);
        
        // If we get here, the test should fail
        fail('Transaction should have failed due to duplicate email');
      } catch (error) {
        // Expected error due to unique constraint violation
        expect(error).toBeDefined();
      }
      
      // Verify the product was not created (transaction rolled back)
      const products = await prisma.product.findMany({
        where: { title: 'Rollback Product' }
      });
      
      expect(products).toHaveLength(0);
      
      // Clean up
      await prisma.user.delete({ where: { id: existingUser.id } });
    });
    
    it('should handle nested writes in a transaction', async () => {
      // Act - Create user with address in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateUniqueEmail('nested'),
            name: 'Nested Transaction User',
            password: await bcrypt.hash('password123', 10),
            addresses: {
              create: {
                name: 'Home',
                street: '123 Nested St',
                city: 'Transaction City',
                state: 'TX',
                postalCode: '12345',
                country: 'Test Country',
                isDefault: true,
              }
            }
          },
          include: {
            addresses: true
          }
        });
        
        return user;
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.addresses).toHaveLength(1);
      expect(result.addresses[0].street).toBe('123 Nested St');
      
      // Clean up
      await prisma.address.deleteMany({ where: { userId: result.id } });
      await prisma.user.delete({ where: { id: result.id } });
    });
  });
  
  describe('Cascade Delete Operations', () => {
    it('should cascade delete addresses when a user is deleted', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create addresses for the user
      const address1 = await prisma.address.create({
        data: {
          userId: user.id,
          name: 'Home',
          street: '123 Cascade St',
          city: 'Cascade City',
          state: 'CA',
          postalCode: '12345',
          country: 'Test Country',
          isDefault: true,
        }
      });
      
      const address2 = await prisma.address.create({
        data: {
          userId: user.id,
          name: 'Work',
          street: '456 Cascade Ave',
          city: 'Cascade City',
          state: 'CA',
          postalCode: '67890',
          country: 'Test Country',
          isDefault: false,
        }
      });
      
      // Verify addresses exist
      const addresses = await prisma.address.findMany({
        where: { userId: user.id }
      });
      expect(addresses).toHaveLength(2);
      
      // Act - Delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });
      
      // Assert - Addresses should be deleted
      const remainingAddresses = await prisma.address.findMany({
        where: {
          OR: [
            { id: address1.id },
            { id: address2.id }
          ]
        }
      });
      
      expect(remainingAddresses).toHaveLength(0);
    });
    
    it('should cascade delete order items when an order is deleted', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a product
      const product = await prisma.product.create({
        data: {
          title: 'Cascade Product',
          description: 'Product for cascade delete test',
          price: 29.99,
          images: JSON.stringify(['cascade.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['cascade', 'test']),
          sellerId: user.id,
        }
      });
      
      // Create an order with items
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          total: 59.98,
          status: 'PENDING',
          orderItems: {
            create: {
              productId: product.id,
              quantity: 2,
              price: 29.99,
            }
          }
        },
        include: {
          orderItems: true
        }
      });
      
      // Verify order item exists
      expect(order.orderItems).toHaveLength(1);
      const orderItemId = order.orderItems[0].id;
      
      // Act - Delete the order
      await prisma.order.delete({
        where: { id: order.id }
      });
      
      // Assert - Order items should be deleted
      const remainingOrderItems = await prisma.orderItem.findMany({
        where: { id: orderItemId }
      });
      
      expect(remainingOrderItems).toHaveLength(0);
      
      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
    
    it('should cascade delete wishlist items when a product is deleted', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a product
      const product = await prisma.product.create({
        data: {
          title: 'Wishlist Cascade Product',
          description: 'Product for wishlist cascade test',
          price: 39.99,
          images: JSON.stringify(['wishlist-cascade.jpg']),
          category: 'CLOTHING',
          condition: 'NEW',
          tags: JSON.stringify(['wishlist', 'cascade']),
          sellerId: user.id,
        }
      });
      
      // Add product to wishlist
      const wishlistItem = await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: product.id,
        }
      });
      
      // Verify wishlist item exists
      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistItem.id }
      });
      expect(wishlist).toBeDefined();
      
      // Act - Delete the product
      await prisma.product.delete({
        where: { id: product.id }
      });
      
      // Assert - Wishlist item should be deleted
      const remainingWishlistItems = await prisma.wishlist.findMany({
        where: { id: wishlistItem.id }
      });
      
      expect(remainingWishlistItems).toHaveLength(0);
      
      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });
    
    it('should cascade delete reviews when a product is deleted', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a product
      const product = await prisma.product.create({
        data: {
          title: 'Review Cascade Product',
          description: 'Product for review cascade test',
          price: 49.99,
          images: JSON.stringify(['review-cascade.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['review', 'cascade']),
          sellerId: user.id,
        }
      });
      
      // Create a review for the product
      const review = await prisma.review.create({
        data: {
          rating: 5,
          comment: 'Great product for testing cascades!',
          productId: product.id,
          reviewerId: user.id,
          reviewerName: user.name,
        }
      });
      
      // Verify review exists
      const foundReview = await prisma.review.findUnique({
        where: { id: review.id }
      });
      expect(foundReview).toBeDefined();
      
      // Act - Delete the product
      await prisma.product.delete({
        where: { id: product.id }
      });
      
      // Assert - Review should be deleted
      const remainingReviews = await prisma.review.findMany({
        where: { id: review.id }
      });
      
      expect(remainingReviews).toHaveLength(0);
      
      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
  
  describe('JSON Field Handling', () => {
    it('should correctly store and retrieve JSON array fields', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a product with JSON arrays
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const tags = ['json', 'test', 'array'];
      
      const product = await prisma.product.create({
        data: {
          title: 'JSON Test Product',
          description: 'Product for testing JSON fields',
          price: 59.99,
          images: JSON.stringify(images),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(tags),
          sellerId: user.id,
        }
      });
      
      // Act - Retrieve the product
      const retrievedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      
      // Assert
      expect(retrievedProduct).toBeDefined();
      expect(JSON.parse(retrievedProduct.images)).toEqual(images);
      expect(JSON.parse(retrievedProduct.tags)).toEqual(tags);
      
      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
    
    it('should correctly store and retrieve complex JSON objects', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a user with social media links as JSON
      const socialLinks = {
        facebook: 'https://facebook.com/testuser',
        twitter: 'https://twitter.com/testuser',
        instagram: 'https://instagram.com/testuser',
        website: 'https://example.com'
      };
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSeller: true,
          sellerApproved: true,
          shopName: 'JSON Test Shop',
          sellerSocial: JSON.stringify(socialLinks)
        }
      });
      
      // Act - Retrieve the user
      const retrievedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      // Assert
      expect(retrievedUser).toBeDefined();
      expect(JSON.parse(retrievedUser.sellerSocial)).toEqual(socialLinks);
      
      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });
    
    it('should handle updating JSON fields', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a product with initial JSON data
      const initialImages = ['initial1.jpg', 'initial2.jpg'];
      const initialTags = ['initial', 'tags'];
      
      const product = await prisma.product.create({
        data: {
          title: 'JSON Update Test Product',
          description: 'Product for testing JSON field updates',
          price: 69.99,
          images: JSON.stringify(initialImages),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(initialTags),
          sellerId: user.id,
        }
      });
      
      // Act - Update JSON fields
      const updatedImages = ['updated1.jpg', 'updated2.jpg', 'updated3.jpg'];
      const updatedTags = ['updated', 'tags', 'new'];
      
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          images: JSON.stringify(updatedImages),
          tags: JSON.stringify(updatedTags)
        }
      });
      
      // Assert
      expect(updatedProduct).toBeDefined();
      expect(JSON.parse(updatedProduct.images)).toEqual(updatedImages);
      expect(JSON.parse(updatedProduct.tags)).toEqual(updatedTags);
      
      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
  
  describe('Concurrent Transaction Handling', () => {
    it('should handle concurrent transactions with potential deadlocks', async () => {
      // Create test users
      const user1 = await createTestUser({ name: 'Deadlock Test User 1' });
      const user2 = await createTestUser({ name: 'Deadlock Test User 2' });
      
      // Create test products
      const product1 = await prisma.product.create({
        data: {
          title: 'Deadlock Test Product 1',
          description: 'Product for deadlock testing 1',
          price: 19.99,
          images: JSON.stringify(['deadlock1.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['deadlock', 'test']),
          sellerId: user1.id,
        }
      });
      
      const product2 = await prisma.product.create({
        data: {
          title: 'Deadlock Test Product 2',
          description: 'Product for deadlock testing 2',
          price: 29.99,
          images: JSON.stringify(['deadlock2.jpg']),
          category: 'CLOTHING',
          condition: 'NEW',
          tags: JSON.stringify(['deadlock', 'test']),
          sellerId: user2.id,
        }
      });
      
      // Create a function to simulate a transaction that updates both products
      // but in different orders, which could cause a deadlock
      const updateProductsInTransaction = async (firstProductId, secondProductId, retryCount = 3) => {
        try {
          return await prisma.$transaction(async (tx) => {
            // Update first product
            await tx.product.update({
              where: { id: firstProductId },
              data: { price: 99.99 }
            });
            
            // Simulate some processing time to increase chance of deadlock
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update second product
            await tx.product.update({
              where: { id: secondProductId },
              data: { price: 199.99 }
            });
            
            return { success: true };
          }, {
            // Set a timeout for the transaction
            timeout: 5000,
            // Use serializable isolation level to prevent dirty reads
            isolationLevel: 'Serializable'
          });
        } catch (error) {
          // If this is a deadlock error and we have retries left, try again
          if (error.message.includes('deadlock') && retryCount > 0) {
            console.log(`Deadlock detected, retrying (${retryCount} attempts left)`);
            // Wait a bit before retrying to reduce chance of another deadlock
            await new Promise(resolve => setTimeout(resolve, 200));
            return updateProductsInTransaction(firstProductId, secondProductId, retryCount - 1);
          }
          throw error;
        }
      };
      
      // Start two concurrent transactions that could deadlock
      const transaction1Promise = updateProductsInTransaction(product1.id, product2.id);
      const transaction2Promise = updateProductsInTransaction(product2.id, product1.id);
      
      // Wait for both transactions to complete
      const [result1, result2] = await Promise.allSettled([
        transaction1Promise,
        transaction2Promise
      ]);
      
      // At least one transaction should succeed
      const atLeastOneSucceeded = 
        (result1.status === 'fulfilled' && result1.value.success) || 
        (result2.status === 'fulfilled' && result2.value.success);
      
      expect(atLeastOneSucceeded).toBe(true);
      
      // Verify products were updated
      const updatedProduct1 = await prisma.product.findUnique({
        where: { id: product1.id }
      });
      
      const updatedProduct2 = await prisma.product.findUnique({
        where: { id: product2.id }
      });
      
      // At least one product should have been updated
      const atLeastOneUpdated = 
        updatedProduct1.price !== 19.99 || 
        updatedProduct2.price !== 29.99;
      
      expect(atLeastOneUpdated).toBe(true);
      
      // Clean up
      await prisma.product.deleteMany({
        where: {
          id: {
            in: [product1.id, product2.id]
          }
        }
      });
      
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [user1.id, user2.id]
          }
        }
      });
    });
    
    it('should handle transaction retries with exponential backoff', async () => {
      // Create a test user
      const user = await createTestUser({ name: 'Retry Test User' });
      
      // Create a test product
      const product = await prisma.product.create({
        data: {
          title: 'Retry Test Product',
          description: 'Product for transaction retry testing',
          price: 39.99,
          images: JSON.stringify(['retry.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['retry', 'test']),
          sellerId: user.id,
        }
      });
      
      // Function to perform a transaction with retry logic
      const performTransactionWithRetry = async (maxRetries = 3) => {
        let retryCount = 0;
        let lastError = null;
        
        // Exponential backoff delay calculation
        const getBackoffDelay = (retry) => Math.min(100 * Math.pow(2, retry), 1000);
        
        while (retryCount <= maxRetries) {
          try {
            return await prisma.$transaction(async (tx) => {
              // Get current product data
              const currentProduct = await tx.product.findUnique({
                where: { id: product.id }
              });
              
              // Simulate a condition that might cause a conflict
              if (currentProduct.price > 100) {
                throw new Error('Price too high');
              }
              
              // Update the product
              return await tx.product.update({
                where: { id: product.id },
                data: { 
                  price: currentProduct.price + 10,
                  description: `Updated at retry ${retryCount}: ${new Date().toISOString()}`
                }
              });
            }, {
              timeout: 5000
            });
          } catch (error) {
            lastError = error;
            retryCount++;
            
            // If we've used all retries, throw the last error
            if (retryCount > maxRetries) {
              throw lastError;
            }
            
            // Wait with exponential backoff before retrying
            const delay = getBackoffDelay(retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };
      
      // Perform the transaction with retry logic
      const updatedProduct = await performTransactionWithRetry();
      
      // Verify the product was updated
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.id).toBe(product.id);
      expect(updatedProduct.price).toBe(49.99); // 39.99 + 10
      expect(updatedProduct.description).toContain('Updated at retry');
      
      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
  
  describe('Constraint Validation', () => {
    it('should enforce foreign key constraints', async () => {
      // Arrange
      const nonExistentUserId = 'user-does-not-exist';
      
      // Act & Assert - Try to create an address with non-existent user ID
      await expect(
        prisma.address.create({
          data: {
            userId: nonExistentUserId,
            name: 'Invalid Address',
            street: '123 Invalid St',
            city: 'Invalid City',
            state: 'IN',
            postalCode: '12345',
            country: 'Invalid Country',
            isDefault: true,
          }
        })
      ).rejects.toThrow();
    });
    
    it('should enforce unique constraints on wishlist items', async () => {
      // Arrange
      const user = await createTestUser();
      
      // Create a product
      const product = await prisma.product.create({
        data: {
          title: 'Unique Constraint Product',
          description: 'Product for testing unique constraints',
          price: 79.99,
          images: JSON.stringify(['constraint.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['constraint', 'test']),
          sellerId: user.id,
        }
      });
      
      // Add product to wishlist
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: product.id,
        }
      });
      
      // Act & Assert - Try to add the same product to wishlist again
      await expect(
        prisma.wishlist.create({
          data: {
            userId: user.id,
            productId: product.id,
          }
        })
      ).rejects.toThrow();
      
      // Clean up
      await prisma.wishlist.deleteMany({ where: { userId: user.id } });
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
