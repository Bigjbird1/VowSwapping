import bcrypt from 'bcryptjs';
const { 
  setupTestDatabase, 
  getTestPrismaClient, 
  generateUniqueEmail,
  setTestContext,
  resetTestState,
  createTestUser,
  createTestSeller,
  cleanupTestData
} = require('./db-test-setup');

// Create a new instance of PrismaClient for testing
let prisma;

// Set up test context and database before all tests
beforeAll(async () => {
  // Increase timeout to 60 seconds for database setup
  jest.setTimeout(60000);
  try {
    console.log('=== Starting database integration tests ===');
    
    // Set initial test context
    setTestContext('Database Integration Tests', 'prisma-models.test.js');
    
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
    
    console.log('Test database and Prisma client initialized successfully');
  } catch (error) {
    console.error('Error in beforeAll setup:', error);
    throw error;
  }
});

// Update test context before each test
beforeEach(() => {
  const state = expect.getState();
  setTestContext(state.currentTestName, state.testPath);
  resetTestState();
});

// Reset state before each test
beforeEach(() => {
  // Set test name and suite name from current test context
  const state = expect.getState();
  setTestContext(state.currentTestName, state.testPath);
  // Reset test state to ensure consistent email generation within tests
  resetTestState();
});

// Clean up after each test to ensure isolation
afterEach(async () => {
  try {
    await cleanupTestData(prisma);
  } catch (error) {
    console.error('Error in afterEach cleanup:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Final cleanup
    await cleanupTestData(prisma);
    await prisma.$disconnect();
    console.log('=== Database integration tests completed ===');
  } catch (error) {
    console.error('Error in afterAll cleanup:', error);
  }
});

describe('Prisma Models and Relationships', () => {
  describe('User Model', () => {
    it('should create a user with basic fields', async () => {
      // Arrange
      const email = generateUniqueEmail();
      const name = 'Test User';
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Act
      const user = await createTestUser(prisma, {
        email,
        name,
        password: hashedPassword,
      });

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const email = generateUniqueEmail();
      const name = 'Test User';
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create first user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      // Act & Assert
      await expect(
        prisma.user.create({
          data: {
            email, // Same email as first user
            name: 'Another User',
            password: hashedPassword,
          },
        })
      ).rejects.toThrow(); // Should throw due to unique constraint

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should update user fields correctly', async () => {
      // Arrange
      const email = generateUniqueEmail();
      const user = await prisma.user.create({
        data: {
          email,
          name: 'Original Name',
          password: await bcrypt.hash('password123', 10),
        },
      });

      // Act
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: 'Updated Name',
          image: 'https://example.com/image.jpg',
        },
      });

      // Assert
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.image).toBe('https://example.com/image.jpg');

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Product Model', () => {
    let testUser;

    // Create a test user before product tests
    beforeEach(async () => {
      // Create a test user with a consistent name for product tests
      testUser = await createTestUser(prisma, {
        name: 'Product Test User',
        email: generateUniqueEmail('product-user'),
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify the user was created successfully
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      console.log(`Product test using user with ID: ${testUser.id}`);
    });

    it('should create a product with all fields', async () => {
      // Arrange
      const productData = {
        title: 'Test Product',
        description: 'This is a test product',
        price: 99.99,
        discountPrice: 79.99,
        images: JSON.stringify(['image1.jpg', 'image2.jpg']),
        category: 'ELECTRONICS',
        condition: 'NEW',
        tags: JSON.stringify(['test', 'product']),
        featured: true,
        sellerId: testUser.id,
      };

      // Act
      const product = await prisma.product.create({
        data: productData,
      });

      // Assert
      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.title).toBe(productData.title);
      expect(product.price).toBe(productData.price);
      expect(product.images).toBe(productData.images);
      expect(product.sellerId).toBe(testUser.id);
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);

      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
    });

    it('should retrieve a product with its seller', async () => {
      // Arrange
      const product = await prisma.product.create({
        data: {
          title: 'Test Product with Seller',
          description: 'This is a test product with a seller relationship',
          price: 149.99,
          images: JSON.stringify(['image.jpg']),
          category: 'CLOTHING',
          condition: 'LIKE_NEW',
          tags: JSON.stringify(['test']),
          sellerId: testUser.id,
        },
      });

      // Act
      const productWithSeller = await prisma.product.findUnique({
        where: { id: product.id },
        include: { seller: true },
      });

      // Assert
      expect(productWithSeller).toBeDefined();
      expect(productWithSeller.seller).toBeDefined();
      expect(productWithSeller.seller.id).toBe(testUser.id);
      expect(productWithSeller.seller.name).toBe('Product Test User');

      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
    });
  });

  describe('Order and OrderItem Models', () => {
    let testUser;
    let testProduct;

    // Set up test user and product before each test
    beforeEach(async () => {
      // Create a test user with a consistent name for order tests
      testUser = await createTestUser(prisma, {
        name: 'Order Test User',
        email: generateUniqueEmail('order-user'),
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify the user was created successfully
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      console.log(`Order test using user with ID: ${testUser.id}`);

      // Create a test product for order tests
      testProduct = await prisma.product.create({
        data: {
          title: 'Order Test Product',
          description: 'Product for order tests',
          price: 49.99,
          images: JSON.stringify(['order-product.jpg']),
          category: 'HOME',
          condition: 'NEW',
          tags: JSON.stringify(['order', 'test']),
          sellerId: testUser.id,
        },
      });
      
      // Verify the product was created successfully
      expect(testProduct).toBeDefined();
      expect(testProduct.id).toBeDefined();
      console.log(`Order test using product with ID: ${testProduct.id}`);
    });

    it('should create an order with order items', async () => {
      // Arrange
      const orderData = {
        userId: testUser.id,
        total: 99.98, // 2 * 49.99
        status: 'PENDING',
        orderItems: {
          create: {
            productId: testProduct.id,
            quantity: 2,
            price: 49.99,
          },
        },
      };

      // Act
      const order = await prisma.order.create({
        data: orderData,
        include: {
          orderItems: true,
        },
      });

      // Assert
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.userId).toBe(testUser.id);
      expect(order.total).toBe(99.98);
      expect(order.status).toBe('PENDING');
      expect(order.orderItems).toHaveLength(1);
      expect(order.orderItems[0].productId).toBe(testProduct.id);
      expect(order.orderItems[0].quantity).toBe(2);
      expect(order.orderItems[0].price).toBe(49.99);

      // Clean up
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
    });

    it('should retrieve an order with its items and products', async () => {
      // Arrange
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          total: 49.99,
          status: 'PROCESSING',
          orderItems: {
            create: {
              productId: testProduct.id,
              quantity: 1,
              price: 49.99,
            },
          },
        },
      });

      // Act
      const orderWithDetails = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Assert
      expect(orderWithDetails).toBeDefined();
      expect(orderWithDetails.user.id).toBe(testUser.id);
      expect(orderWithDetails.orderItems).toHaveLength(1);
      expect(orderWithDetails.orderItems[0].product.id).toBe(testProduct.id);
      expect(orderWithDetails.orderItems[0].product.title).toBe('Order Test Product');

      // Clean up
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
    });
  });

  describe('Address Model', () => {
    let testUser;

    // Set up test user before each test
    beforeEach(async () => {
      // Create a test user with a consistent name for address tests
      testUser = await createTestUser(prisma, {
        name: 'Address Test User',
        email: generateUniqueEmail('address-user'),
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify the user was created successfully
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      console.log(`Address test using user with ID: ${testUser.id}`);
    });

    it('should create an address for a user', async () => {
      // Arrange
      const addressData = {
        userId: testUser.id,
        name: 'Home',
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
        isDefault: true,
      };

      // Act
      const address = await prisma.address.create({
        data: addressData,
      });

      // Assert
      expect(address).toBeDefined();
      expect(address.id).toBeDefined();
      expect(address.userId).toBe(testUser.id);
      expect(address.street).toBe(addressData.street);
      expect(address.city).toBe(addressData.city);
      expect(address.isDefault).toBe(true);

      // Clean up
      await prisma.address.delete({ where: { id: address.id } });
    });

    it('should retrieve all addresses for a user', async () => {
      // Arrange
      const address1 = await prisma.address.create({
        data: {
          userId: testUser.id,
          name: 'Home',
          street: '123 Home St',
          city: 'Home City',
          state: 'Home State',
          postalCode: '12345',
          country: 'Home Country',
          isDefault: true,
        },
      });

      const address2 = await prisma.address.create({
        data: {
          userId: testUser.id,
          name: 'Work',
          street: '456 Work Ave',
          city: 'Work City',
          state: 'Work State',
          postalCode: '67890',
          country: 'Work Country',
          isDefault: false,
        },
      });

      // Act
      const addresses = await prisma.address.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'asc' },
      });

      // Assert
      expect(addresses).toHaveLength(2);
      expect(addresses[0].name).toBe('Home');
      expect(addresses[1].name).toBe('Work');
      expect(addresses.find(a => a.isDefault)).toBeDefined();

      // Clean up
      await prisma.address.deleteMany({ where: { userId: testUser.id } });
    });
  });

  describe('Wishlist Model', () => {
    let testUser;
    let testProduct;

    // Set up test user and product before each test
    beforeEach(async () => {
      // Create a test user with a consistent name for wishlist tests
      testUser = await createTestUser(prisma, {
        name: 'Wishlist Test User',
        email: generateUniqueEmail('wishlist-user'),
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify the user was created successfully
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      console.log(`Wishlist test using user with ID: ${testUser.id}`);

      // Create a test product for wishlist tests
      testProduct = await prisma.product.create({
        data: {
          title: 'Wishlist Test Product',
          description: 'Product for wishlist tests',
          price: 29.99,
          images: JSON.stringify(['wishlist-product.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['wishlist', 'test']),
          sellerId: testUser.id,
        },
      });
      
      // Verify the product was created successfully
      expect(testProduct).toBeDefined();
      expect(testProduct.id).toBeDefined();
      console.log(`Wishlist test using product with ID: ${testProduct.id}`);
    });

    it('should add a product to user wishlist', async () => {
      // Act
      const wishlistItem = await prisma.wishlist.create({
        data: {
          userId: testUser.id,
          productId: testProduct.id,
        },
      });

      // Assert
      expect(wishlistItem).toBeDefined();
      expect(wishlistItem.id).toBeDefined();
      expect(wishlistItem.userId).toBe(testUser.id);
      expect(wishlistItem.productId).toBe(testProduct.id);

      // Clean up
      await prisma.wishlist.delete({ where: { id: wishlistItem.id } });
    });

    it('should enforce unique constraint on user-product combination', async () => {
      // Arrange
      const wishlistItem = await prisma.wishlist.create({
        data: {
          userId: testUser.id,
          productId: testProduct.id,
        },
      });

      // Act & Assert
      await expect(
        prisma.wishlist.create({
          data: {
            userId: testUser.id,
            productId: testProduct.id,
          },
        })
      ).rejects.toThrow(); // Should throw due to unique constraint

      // Clean up
      await prisma.wishlist.delete({ where: { id: wishlistItem.id } });
    });

    it('should retrieve wishlist items with product details', async () => {
      // Arrange
      const wishlistItem = await prisma.wishlist.create({
        data: {
          userId: testUser.id,
          productId: testProduct.id,
        },
      });

      // Act
      const wishlistWithProduct = await prisma.wishlist.findUnique({
        where: { id: wishlistItem.id },
        include: { product: true },
      });

      // Assert
      expect(wishlistWithProduct).toBeDefined();
      expect(wishlistWithProduct.product).toBeDefined();
      expect(wishlistWithProduct.product.id).toBe(testProduct.id);
      expect(wishlistWithProduct.product.title).toBe('Wishlist Test Product');

      // Clean up
      await prisma.wishlist.delete({ where: { id: wishlistItem.id } });
    });
  });

  describe('Review Model', () => {
    let testUser;
    let testSeller;
    let testProduct;

    // Set up test users and product before each test
    beforeEach(async () => {
      // Create a test user with a consistent name for review tests
      testUser = await createTestUser(prisma, {
        name: 'Review Test User',
        email: generateUniqueEmail('review-user'),
        password: await bcrypt.hash('password123', 10),
      });
      
      // Verify the user was created successfully
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      console.log(`Review test using user with ID: ${testUser.id}`);

      // Create a test seller with a consistent name for review tests
      testSeller = await createTestSeller(prisma, {
        name: 'Review Test Seller',
        email: generateUniqueEmail('review-seller'),
        password: await bcrypt.hash('password123', 10),
        shopName: 'Test Shop',
      });
      
      // Verify the seller was created successfully
      expect(testSeller).toBeDefined();
      expect(testSeller.id).toBeDefined();
      console.log(`Review test using seller with ID: ${testSeller.id}`);

      // Create a test product for review tests
      testProduct = await prisma.product.create({
        data: {
          title: 'Review Test Product',
          description: 'Product for review tests',
          price: 39.99,
          images: JSON.stringify(['review-product.jpg']),
          category: 'ELECTRONICS',
          condition: 'NEW',
          tags: JSON.stringify(['review', 'test']),
          sellerId: testSeller.id,
        },
      });
      
      // Verify the product was created successfully
      expect(testProduct).toBeDefined();
      expect(testProduct.id).toBeDefined();
      console.log(`Review test using product with ID: ${testProduct.id}`);
    });

    it('should create a product review', async () => {
      // Arrange
      const reviewData = {
        rating: 5,
        comment: 'Great product, highly recommend!',
        productId: testProduct.id,
        reviewerId: testUser.id,
        reviewerName: 'Review Test User',
      };

      // Act
      const review = await prisma.review.create({
        data: reviewData,
      });

      // Assert
      expect(review).toBeDefined();
      expect(review.id).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.comment).toBe(reviewData.comment);
      expect(review.productId).toBe(testProduct.id);
      expect(review.reviewerId).toBe(testUser.id);

      // Clean up
      await prisma.review.delete({ where: { id: review.id } });
    });

    it('should create a seller review', async () => {
      // Arrange
      const reviewData = {
        rating: 4,
        comment: 'Good seller, fast shipping',
        sellerId: testSeller.id,
        reviewerId: testUser.id,
        reviewerName: 'Review Test User',
      };

      // Act
      const review = await prisma.review.create({
        data: reviewData,
      });

      // Assert
      expect(review).toBeDefined();
      expect(review.id).toBeDefined();
      expect(review.rating).toBe(4);
      expect(review.comment).toBe(reviewData.comment);
      expect(review.sellerId).toBe(testSeller.id);
      expect(review.reviewerId).toBe(testUser.id);

      // Clean up
      await prisma.review.delete({ where: { id: review.id } });
    });

    it('should retrieve product reviews with details', async () => {
      // Arrange
      const review = await prisma.review.create({
        data: {
          rating: 5,
          comment: 'Excellent product!',
          productId: testProduct.id,
          reviewerId: testUser.id,
          reviewerName: 'Review Test User',
        },
      });

      // Act
      const productWithReviews = await prisma.product.findUnique({
        where: { id: testProduct.id },
        include: { reviews: true },
      });

      // Assert
      expect(productWithReviews).toBeDefined();
      expect(productWithReviews.reviews).toHaveLength(1);
      expect(productWithReviews.reviews[0].id).toBe(review.id);
      expect(productWithReviews.reviews[0].rating).toBe(5);

      // Clean up
      await prisma.review.delete({ where: { id: review.id } });
    });
  });
});
