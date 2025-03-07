# Database Testing Guide for VowSwapping

This guide explains how to write and run database tests for the VowSwapping application.

## Introduction

Database tests verify that the database schema is correctly set up and that the models work as expected. These tests are critical for ensuring data integrity and proper relationships between models.

## Setup

The VowSwapping project uses Prisma ORM for database access and Jest for testing. The database tests are located in the `__tests__/database/` directory.

## Test Structure

The database tests are organized into three main files:

1. `prisma-models.test.js`: Tests for Prisma models and their relationships
2. `data-persistence.test.js`: Tests for data persistence across user sessions
3. `migrations.test.js`: Tests for database migrations

## Test Helpers

The `__tests__/database/db-test-setup.js` file provides helper functions for setting up and tearing down the test database:

- `setupTestDatabase()`: Sets up a clean test database
- `getTestPrismaClient()`: Creates a new Prisma client connected to the test database
- `generateUniqueEmail()`: Generates a unique email for test users
- `createTestUser()`: Creates a test user in the database
- `cleanupTestData()`: Cleans up test data after tests

## Running Tests

### Testing Database Connection

To test the database connection and verify that the schema is correctly set up:

```bash
node test-db-connection.js
```

### Running All Database Tests

To run all database tests:

```bash
./run-db-tests.sh
```

### Running Specific Tests

To run a specific test file:

```bash
npx jest __tests__/database/prisma-models.test.js
```

## Writing Tests

### Model Tests

Model tests verify that the Prisma models work correctly. Here's an example of a model test:

```javascript
describe('User Model', () => {
  let prisma;
  let testUser;

  beforeAll(async () => {
    // Set up the test database and create a Prisma client
    await setupTestDatabase();
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    // Clean up test data and disconnect from the database
    await cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  it('should create a user with basic fields', async () => {
    // Arrange
    const userData = {
      email: generateUniqueEmail(),
      name: 'Test User',
      password: 'password123',
    };

    // Act
    testUser = await createTestUser(prisma, userData);

    // Assert
    expect(testUser).toBeDefined();
    expect(testUser.id).toBeDefined();
    expect(testUser.email).toBe(userData.email);
    expect(testUser.name).toBe(userData.name);
    expect(testUser.password).toBe(userData.password);
    expect(testUser.createdAt).toBeInstanceOf(Date);
    expect(testUser.updatedAt).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Arrange
    const userData = {
      email: testUser.email, // Use the same email as the existing user
      name: 'Another User',
      password: 'password456',
    };

    // Act & Assert
    await expect(
      createTestUser(prisma, userData)
    ).rejects.toThrow(); // Should throw due to unique constraint
  });
});
```

### Relationship Tests

Relationship tests verify that the relationships between models work correctly. Here's an example of a relationship test:

```javascript
describe('Product Model', () => {
  let prisma;
  let testUser;
  let testProduct;

  beforeAll(async () => {
    // Set up the test database and create a Prisma client
    await setupTestDatabase();
    prisma = getTestPrismaClient();
    testUser = await createTestUser(prisma);
  });

  afterAll(async () => {
    // Clean up test data and disconnect from the database
    await cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  it('should create a product with all fields', async () => {
    // Arrange
    const productData = {
      title: 'Test Product',
      description: 'A test product',
      price: 99.99,
      category: 'DRESSES',
      condition: 'NEW',
      images: ['https://example.com/image.jpg'],
      tags: JSON.stringify(['test', 'product']),
      featured: true,
      sellerId: testUser.id,
    };

    // Act
    testProduct = await prisma.product.create({
      data: productData,
    });

    // Assert
    expect(testProduct).toBeDefined();
    expect(testProduct.id).toBeDefined();
    expect(testProduct.title).toBe(productData.title);
    expect(testProduct.price).toBe(productData.price);
    expect(testProduct.sellerId).toBe(testUser.id);
  });

  it('should retrieve a product with its seller', async () => {
    // Act
    const productWithSeller = await prisma.product.findUnique({
      where: { id: testProduct.id },
      include: { seller: true },
    });

    // Assert
    expect(productWithSeller).toBeDefined();
    expect(productWithSeller.seller).toBeDefined();
    expect(productWithSeller.seller.id).toBe(testUser.id);
    expect(productWithSeller.seller.name).toBe(testUser.name);
  });
});
```

### Migration Tests

Migration tests verify that database migrations are applied correctly. Here's an example of a migration test:

```javascript
describe('Migration Structure', () => {
  it('should have valid migration files', async () => {
    // Arrange
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    
    // Act
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(dir => !dir.startsWith('.') && dir !== 'migration_lock.toml');
    
    // Assert
    expect(migrationDirs.length).toBeGreaterThan(0);
    
    // Check each migration directory
    for (const dir of migrationDirs) {
      const migrationPath = path.join(migrationsDir, dir);
      const files = fs.readdirSync(migrationPath);
      
      // Each migration should have a migration.sql file
      expect(files).toContain('migration.sql');
      
      // Check that the migration.sql file is not empty
      const migrationSql = fs.readFileSync(path.join(migrationPath, 'migration.sql'), 'utf8');
      expect(migrationSql.length).toBeGreaterThan(0);
    }
  });
});
```

## Best Practices

1. **Isolate Tests**: Each test should be independent of others and should not rely on the state created by previous tests.
2. **Use Test Helpers**: Use the helper functions provided in `db-test-setup.js` to set up and tear down the test database.
3. **Clean Up After Tests**: Always clean up test data after tests to avoid interference between test runs.
4. **Test Edge Cases**: Don't just test the happy path; also test edge cases and error conditions.
5. **Test Relationships**: Test that relationships between models work correctly.
6. **Test Constraints**: Test that database constraints (e.g., unique constraints) are enforced.
7. **Test Migrations**: Test that database migrations are applied correctly.

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Make sure the database URL is correctly set in the `.env` file.
2. **Schema Sync Errors**: Make sure the database schema is up to date by running `npx prisma db push`.
3. **Test Data Cleanup Failures**: If tests are failing due to existing data, try running `npx prisma db push --force-reset` to reset the database.

### Debugging

1. **Check Test Output**: Look at the test output for error messages.
2. **Check Database State**: Use `test-db-connection.js` to check the state of the database.
3. **Add Console Logs**: Add `console.log()` statements to debug specific issues.
4. **Inspect Prisma Queries**: Set `log: ['query']` in the Prisma client options to see the SQL queries being executed.

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Prisma with Jest](https://www.prisma.io/docs/guides/testing/unit-testing)
