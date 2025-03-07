#!/bin/bash

# Run API tests for VowSwapping

echo "Running API tests for VowSwapping..."

# Make sure the script is executable
chmod +x run-api-tests.sh

# Run Jest tests for API endpoints
echo "Running Product API tests..."
npx jest __tests__/api/products.test.js

echo "Running User API tests..."
npx jest __tests__/api/users.test.js

echo "Running Order API tests..."
npx jest __tests__/api/orders.test.js

echo "Running Seller API tests..."
npx jest __tests__/api/sellers.test.js

echo "Running Review API tests..."
npx jest __tests__/api/reviews.test.js

echo "Running Wishlist API tests..."
npx jest __tests__/api/wishlist.test.js

echo "All API tests completed!"
