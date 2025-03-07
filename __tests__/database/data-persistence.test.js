import bcrypt from 'bcryptjs';
const { 
  setupTestDatabase, 
  getTestPrismaClient, 
  generateUniqueEmail,
  setTestContext,
  resetTestState,
  createTestUser,
  cleanupTestData
} = require('./db-test-setup');

// Create a new instance of PrismaClient for testing
let prisma;

// Set up the database before all tests
beforeAll(async () => {
  // Increase timeout to 60 seconds for database setup
  jest.setTimeout(60000);
  try {
    // Initialize the test database
    const setupSuccess = await setupTestDatabase();
    if (!setupSuccess) {
      throw new Error('Failed to set up test database');
    }
    
    // Create a new PrismaClient instance
    prisma = getTestPrismaClient();
    
    // Test the connection by checking if the User model exists
    if (!prisma.user) {
      throw new Error('User model not found in Prisma client');
    }
    
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('Test database and Prisma client initialized successfully for persistence tests');
  } catch (error) {
    console.error('Error in beforeAll setup:', error);
    throw error;
  }
});

describe('Data Persistence Across User Sessions', () => {
  // Set up test context before each test
  beforeEach(() => {
    // Set test name and suite name from current test context
    const state = expect.getState();
    setTestContext(state.currentTestName, state.testPath);
    // Reset test state to ensure consistent email generation within tests
    resetTestState();
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      await cleanupTestData(prisma);
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error in afterAll cleanup:', error);
    }
  });

  describe('User Session Persistence', () => {
    it('should persist user session data', async () => {
      // Create a test user
      const email = generateUniqueEmail();
      const user = await createTestUser(prisma, {
        email,
        name: 'Session Test User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      // Create a session for the user
      const expires = new Date();
      expires.setHours(expires.getHours() + 24); // Session expires in 24 hours

      const session = await prisma.session.create({
        data: {
          sessionToken: `session-token-${Date.now()}`,
          userId: user.id,
          expires,
        },
      });

      // Verify session was created
      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.expires).toBeInstanceOf(Date);

      // Simulate retrieving the session in a different "request"
      const retrievedSession = await prisma.session.findUnique({
        where: { sessionToken: session.sessionToken },
        include: { user: true },
      });

      // Verify session data persists and includes user data
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession.userId).toBe(user.id);
      expect(retrievedSession.user).toBeDefined();
      expect(retrievedSession.user.email).toBe(email);
      expect(retrievedSession.user.name).toBe('Session Test User');

      // Clean up
      await prisma.session.delete({ where: { id: session.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should handle session expiration correctly', async () => {
      // Create a test user
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Expiration Test User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      // Create an expired session
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1); // Session expired 1 hour ago

      const expiredSession = await prisma.session.create({
        data: {
          sessionToken: `expired-session-${Date.now()}`,
          userId: user.id,
          expires: expiredDate,
        },
      });

      // Create a valid session
      const validDate = new Date();
      validDate.setHours(validDate.getHours() + 1); // Session expires in 1 hour

      const validSession = await prisma.session.create({
        data: {
          sessionToken: `valid-session-${Date.now()}`,
          userId: user.id,
          expires: validDate,
        },
      });

      // Query for active sessions (not expired)
      const activeSessions = await prisma.session.findMany({
        where: {
          userId: user.id,
          expires: {
            gt: new Date(), // Greater than current date (not expired)
          },
        },
      });

      // Verify only valid session is returned
      expect(activeSessions.length).toBe(1);
      expect(activeSessions[0].id).toBe(validSession.id);

      // Clean up
      await prisma.session.deleteMany({
        where: {
          id: {
            in: [expiredSession.id, validSession.id],
          },
        },
      });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Cart and Order Persistence', () => {
    it('should persist cart data as order items', async () => {
      // Create a test user and product
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Cart Test User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      const product = await prisma.product.create({
        data: {
          title: 'Cart Test Product',
          description: 'Product for cart persistence test',
          price: 49.99,
          images: JSON.stringify(['cart-product.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['cart', 'test']),
          sellerId: user.id, // User is also the seller for simplicity
        },
      });

      // Simulate cart data (normally stored in client-side state)
      const cartItems = [
        {
          productId: product.id,
          quantity: 2,
          price: product.price,
        },
      ];

      // Create an order from cart data
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          status: 'PENDING',
          orderItems: {
            create: cartItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Verify order and items were persisted
      expect(order).toBeDefined();
      expect(order.total).toBe(99.98); // 2 * 49.99
      expect(order.orderItems).toHaveLength(1);
      expect(order.orderItems[0].productId).toBe(product.id);
      expect(order.orderItems[0].quantity).toBe(2);

      // Simulate retrieving the order in a different "session"
      const retrievedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Verify order data persists with complete information
      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder.orderItems).toHaveLength(1);
      expect(retrievedOrder.orderItems[0].product.title).toBe('Cart Test Product');
      expect(retrievedOrder.orderItems[0].quantity).toBe(2);
      expect(retrievedOrder.orderItems[0].price).toBe(49.99);

      // Clean up
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('User Profile and Address Persistence', () => {
    it('should persist user profile updates across sessions', async () => {
      // Create a test user
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Profile Test User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: 'Updated Name',
          image: 'https://example.com/profile.jpg',
        },
      });

      // Verify update was persisted
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.image).toBe('https://example.com/profile.jpg');

      // Simulate retrieving the user in a different "session"
      const retrievedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // Verify profile changes persist
      expect(retrievedUser.name).toBe('Updated Name');
      expect(retrievedUser.image).toBe('https://example.com/profile.jpg');

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should persist address changes across sessions', async () => {
      // Create a test user
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Address Test User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      // Add an address
      const address = await prisma.address.create({
        data: {
          userId: user.id,
          name: 'Home',
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country',
          isDefault: true,
        },
      });

      // Update the address
      const updatedAddress = await prisma.address.update({
        where: { id: address.id },
        data: {
          street: '456 New St',
          city: 'New City',
        },
      });

      // Verify update was persisted
      expect(updatedAddress.street).toBe('456 New St');
      expect(updatedAddress.city).toBe('New City');

      // Simulate retrieving the address in a different "session"
      const retrievedAddress = await prisma.address.findUnique({
        where: { id: address.id },
      });

      // Verify address changes persist
      expect(retrievedAddress.street).toBe('456 New St');
      expect(retrievedAddress.city).toBe('New City');
      expect(retrievedAddress.state).toBe('Test State'); // Unchanged field

      // Clean up
      await prisma.address.delete({ where: { id: address.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Wishlist Persistence', () => {
    it('should persist wishlist items across sessions', async () => {
      // Create a test user and products
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Wishlist Test User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      const product1 = await prisma.product.create({
        data: {
          title: 'Wishlist Product 1',
          description: 'First product for wishlist test',
          price: 29.99,
          images: JSON.stringify(['wishlist1.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['wishlist', 'test']),
          sellerId: user.id, // User is also the seller for simplicity
        },
      });

      const product2 = await prisma.product.create({
        data: {
          title: 'Wishlist Product 2',
          description: 'Second product for wishlist test',
          price: 39.99,
          images: JSON.stringify(['wishlist2.jpg']),
          category: 'CLOTHING',
          condition: 'NEW',
          tags: JSON.stringify(['wishlist', 'test']),
          sellerId: user.id,
        },
      });

      // Add products to wishlist
      const wishlistItem1 = await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: product1.id,
        },
      });

      const wishlistItem2 = await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: product2.id,
        },
      });

      // Verify wishlist items were created
      expect(wishlistItem1).toBeDefined();
      expect(wishlistItem2).toBeDefined();

      // Simulate retrieving the wishlist in a different "session"
      const retrievedWishlist = await prisma.wishlist.findMany({
        where: { userId: user.id },
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      });

      // Verify wishlist data persists with complete information
      expect(retrievedWishlist).toHaveLength(2);
      expect(retrievedWishlist[0].product.title).toBe('Wishlist Product 1');
      expect(retrievedWishlist[1].product.title).toBe('Wishlist Product 2');

      // Remove an item from wishlist
      await prisma.wishlist.delete({ where: { id: wishlistItem1.id } });

      // Verify removal persists
      const updatedWishlist = await prisma.wishlist.findMany({
        where: { userId: user.id },
      });
      expect(updatedWishlist).toHaveLength(1);
      expect(updatedWishlist[0].id).toBe(wishlistItem2.id);

      // Clean up
      await prisma.wishlist.deleteMany({ where: { userId: user.id } });
      await prisma.product.deleteMany({
        where: {
          id: {
            in: [product1.id, product2.id],
          },
        },
      });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Review Persistence', () => {
    it('should persist product reviews across sessions', async () => {
      // Create test users and product
      const user = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Review User',
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      const seller = await createTestUser(prisma, {
        email: generateUniqueEmail(),
        name: 'Review Seller',
        password: await bcrypt.hash('password123', 10),
        isSeller: true,
        sellerApproved: true,
      });
      
      // Verify seller was created successfully
      expect(seller).toBeDefined();
      expect(seller.id).toBeDefined();

      const product = await prisma.product.create({
        data: {
          title: 'Review Test Product',
          description: 'Product for review persistence test',
          price: 59.99,
          images: JSON.stringify(['review-test.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['review', 'test']),
          sellerId: seller.id,
        },
      });

      // Create a product review
      const review = await prisma.review.create({
        data: {
          rating: 4,
          comment: 'Good product, would recommend',
          productId: product.id,
          reviewerId: user.id,
          reviewerName: user.name,
        },
      });

      // Verify review was created
      expect(review).toBeDefined();
      expect(review.rating).toBe(4);
      expect(review.comment).toBe('Good product, would recommend');

      // Simulate retrieving the review in a different "session"
      const retrievedReview = await prisma.review.findUnique({
        where: { id: review.id },
        include: {
          product: true,
        },
      });

      // Verify review data persists with complete information
      expect(retrievedReview).toBeDefined();
      expect(retrievedReview.rating).toBe(4);
      expect(retrievedReview.product.title).toBe('Review Test Product');

      // Update the review
      const updatedReview = await prisma.review.update({
        where: { id: review.id },
        data: {
          rating: 5,
          comment: 'Updated: Excellent product, highly recommend!',
        },
      });

      // Verify update was persisted
      expect(updatedReview.rating).toBe(5);
      expect(updatedReview.comment).toBe('Updated: Excellent product, highly recommend!');

      // Simulate retrieving the updated review in a different "session"
      const retrievedUpdatedReview = await prisma.review.findUnique({
        where: { id: review.id },
      });

      // Verify review changes persist
      expect(retrievedUpdatedReview.rating).toBe(5);
      expect(retrievedUpdatedReview.comment).toBe('Updated: Excellent product, highly recommend!');

      // Clean up
      await prisma.review.delete({ where: { id: review.id } });
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [user.id, seller.id],
          },
        },
      });
    });
  });
});
