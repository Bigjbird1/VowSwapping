#!/bin/bash

# Run API tests for VowSwapping with improved database connection handling

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running API tests with improved connection handling...${NC}"

# Create test results directory if it doesn't exist
mkdir -p test-results

# Make sure the script is executable
chmod +x run-improved-api-tests.sh

# First, test the database connection with our improved script
echo -e "${YELLOW}Testing database connection...${NC}"
if node test-connection-fix.js; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Database connection failed${NC}"
  echo "See output for details"
  exit 1
fi

# Function to run a test and check its result
run_test() {
  local test_name=$1
  local test_path=$2
  local output_file="test-results/${test_name}.log"
  
  echo -e "${YELLOW}Running ${test_name} tests...${NC}"
  
  # Run the test with improved database setup
  # Use --runInBand to run tests serially (avoid connection conflicts)
  # Use --detectOpenHandles to detect open handles
  # Use --forceExit to force Jest to exit after all tests complete
  npx jest ${test_path} \
    --runInBand \
    --detectOpenHandles \
    --forceExit \
    --testTimeout=30000 \
    --setupFilesAfterEnv=./__tests__/database/improved-db-setup.js > ${output_file} 2>&1
  
  # Check if the test passed
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${test_name} tests passed${NC}"
    return 0
  else
    echo -e "${RED}✗ ${test_name} tests failed${NC}"
    echo -e "${YELLOW}See ${output_file} for details${NC}"
    return 1
  fi
}

# Run each API test suite separately
echo -e "\n${YELLOW}=== Running API Test Suites ===${NC}"

# Run Product API tests
run_test "ProductAPI" "__tests__/api/products.test.js"
PRODUCT_API_RESULT=$?

# Run User API tests
run_test "UserAPI" "__tests__/api/users.test.js"
USER_API_RESULT=$?

# Run Order API tests
run_test "OrderAPI" "__tests__/api/orders.test.js"
ORDER_API_RESULT=$?

# Run Seller API tests
run_test "SellerAPI" "__tests__/api/sellers.test.js"
SELLER_API_RESULT=$?

# Run Review API tests
run_test "ReviewAPI" "__tests__/api/reviews.test.js"
REVIEW_API_RESULT=$?

# Run Wishlist API tests
run_test "WishlistAPI" "__tests__/api/wishlist.test.js"
WISHLIST_API_RESULT=$?

# Summary
echo -e "\n${YELLOW}=== API Test Summary ===${NC}"
total_tests=6
passed_tests=0

# Count passed tests
[ $PRODUCT_API_RESULT -eq 0 ] && ((passed_tests++))
[ $USER_API_RESULT -eq 0 ] && ((passed_tests++))
[ $ORDER_API_RESULT -eq 0 ] && ((passed_tests++))
[ $SELLER_API_RESULT -eq 0 ] && ((passed_tests++))
[ $REVIEW_API_RESULT -eq 0 ] && ((passed_tests++))
[ $WISHLIST_API_RESULT -eq 0 ] && ((passed_tests++))

# Display summary
echo -e "${YELLOW}Tests Passed: ${passed_tests}/${total_tests}${NC}"

# Display detailed results
echo -e "\n${YELLOW}=== Detailed Results ===${NC}"
[ $PRODUCT_API_RESULT -eq 0 ] && echo -e "${GREEN}✓ Product API Tests${NC}" || echo -e "${RED}✗ Product API Tests${NC}"
[ $USER_API_RESULT -eq 0 ] && echo -e "${GREEN}✓ User API Tests${NC}" || echo -e "${RED}✗ User API Tests${NC}"
[ $ORDER_API_RESULT -eq 0 ] && echo -e "${GREEN}✓ Order API Tests${NC}" || echo -e "${RED}✗ Order API Tests${NC}"
[ $SELLER_API_RESULT -eq 0 ] && echo -e "${GREEN}✓ Seller API Tests${NC}" || echo -e "${RED}✗ Seller API Tests${NC}"
[ $REVIEW_API_RESULT -eq 0 ] && echo -e "${GREEN}✓ Review API Tests${NC}" || echo -e "${RED}✗ Review API Tests${NC}"
[ $WISHLIST_API_RESULT -eq 0 ] && echo -e "${GREEN}✓ Wishlist API Tests${NC}" || echo -e "${RED}✗ Wishlist API Tests${NC}"

# Check if all tests passed
if [ $passed_tests -eq $total_tests ]; then
  echo -e "\n${GREEN}All API tests passed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}Some API tests failed. Check the logs in the test-results directory for details.${NC}"
  exit 1
fi
