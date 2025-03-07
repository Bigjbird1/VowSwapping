# JSON Conversion Issue Fix

## Problem

The application encountered an error when running the test suite related to fetching featured products:

```
Invalid `prisma.product.findMany()` invocation:
Inconsistent column data: Could not convert value ["https://images.unsplash.com/photo-1547393947-1849a9bc22f9?ixlib=..."] of the field `images` to type `Json`.
```

This error occurred in the `getFeaturedProducts` function (called by the Home page). The issue was that some values stored in the `images` field in the Product model weren't being converted correctly to JSON.

## Root Cause Analysis

After examining the Prisma schema and database data, we identified that:

1. The Product model correctly defines `images` as a `Json` field in the Prisma schema
2. The seeding process properly handles JSON conversion using `JSON.stringify()` and `::jsonb` casting
3. However, some data in the database had images stored as a raw array string rather than proper JSON

This inconsistency can happen when:
- Data is inserted without proper JSON formatting
- String representations of arrays are stored directly without proper conversion
- A migration didn't properly convert existing data

## Solution

We created a script (`fix-images-json-pg.js`) that:

1. Connects to the PostgreSQL database
2. Queries all products
3. Checks each product's images field format
4. Fixes any malformed data by:
   - Parsing string representations of arrays into proper JSON arrays
   - Converting object representations to arrays when needed
   - Extracting URLs from string formats
   - Ensuring all images are stored as proper JSON arrays
5. Updates the products with the corrected images field format

The script handles several edge cases:
- String representations of arrays
- Escaped quotes in strings
- Objects with numeric keys that should be arrays
- Single image URLs that should be in an array

## Prevention

To prevent similar issues in the future:

1. **Data Validation**: Always validate data before inserting it into the database, ensuring it matches the expected format.

2. **Type Consistency**: When working with JSON fields:
   - Always use `JSON.stringify()` before storing data
   - Cast to the appropriate database type (e.g., `::jsonb` for PostgreSQL)
   - Use proper parameterized queries to prevent formatting issues

3. **Migration Testing**: When changing field types or formats, create migration scripts that properly convert existing data.

4. **Error Handling**: Add better error handling in data access functions to provide clearer error messages when JSON conversion fails.

## Implementation Details

The fix was implemented in a script that:
1. Connects to the PostgreSQL database using the connection string from environment variables
2. Fetches all products from the database
3. Processes each product to check and fix the images field format
4. Updates products with corrected data using parameterized queries and proper JSON casting

This approach ensures that all data in the database is consistently formatted as proper JSON, allowing Prisma to correctly convert it when querying.
