# PostgreSQL Database Testing Setup

This document explains how the database testing has been configured to use PostgreSQL with Supabase instead of SQLite.

## Overview

The testing infrastructure has been updated to use PostgreSQL with schema-based isolation instead of file-based SQLite databases. This approach:

1. Better matches the production environment
2. Provides more reliable testing
3. Avoids SQLite-specific locking issues
4. Allows for proper transaction isolation

## Key Components

### 1. Schema-Based Isolation

Instead of creating separate database files for testing, we use PostgreSQL schemas:

- Production data stays in the `public` schema
- Test data goes in the `test` schema
- Each test suite can create its own temporary schema if needed

### 2. Connection Configuration

The database connection is configured with:

```
DATABASE_URL="postgresql://postgres:Pleasework123!@db.ayuukerzreoiqevkhhlv.supabase.co:5432/postgres"
TEST_DATABASE_URL="postgresql://postgres:Pleasework123!@db.ayuukerzreoiqevkhhlv.supabase.co:5432/postgres?schema=test"
```

### 3. Test Setup Process

The test setup process:

1. Creates the test schema if it doesn't exist
2. Grants necessary permissions
3. Cleans up any existing tables in the test schema
4. Applies the Prisma schema to create tables
5. Verifies the connection

### 4. Test Cleanup

After tests complete:

1. All data is deleted from test tables
2. Sequences are reset
3. The schema can be dropped if needed

## Key Files

- `prisma/schema.prisma`: Updated to use PostgreSQL
- `prisma/ensure-test-schema.js`: Creates and verifies the test schema
- `__tests__/database/db-test-setup.js`: Core testing utilities
- `run-db-tests.sh`: Script to run database tests

## Running Tests

To run the database tests:

```bash
./run-db-tests.sh
```

This will:
1. Set up the test schema
2. Run the Prisma model tests
3. Run the migration tests
4. Run the data persistence tests
5. Clean up the test schema

## Troubleshooting

If tests fail with connection issues:

1. Verify the Supabase connection is active
2. Check that the schema exists and has proper permissions
3. Ensure no conflicting connections are active

For schema cleanup issues:

1. Manually drop the test schema: `DROP SCHEMA test CASCADE;`
2. Recreate it: `CREATE SCHEMA test;`
3. Grant permissions: `GRANT ALL ON SCHEMA test TO postgres;`
