#!/bin/bash

# Run all tests for VowSwap with improved database connection handling

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== VowSwap Test Suite Runner (Improved) ===${NC}"
echo ""

# Create test results directory if it doesn't exist
mkdir -p test-results

# Create a log file for the test output
LOG_FILE="test-output-improved.log"
DETAILED_LOG="test-output-detailed-improved.log"

# Clear previous log files
> $LOG_FILE
> $DETAILED_LOG

# Make sure the scripts are executable
chmod +x run-improved-db-tests.sh
chmod +x run-improved-api-tests.sh

# Function to log messages to both console and log file
log() {
  echo -e "$1" | tee -a $LOG_FILE
  echo -e "$1" >> $DETAILED_LOG
}

# Function to run a test and log the result
run_test() {
  TEST_NAME=$1
  TEST_COMMAND=$2
  
  log "${YELLOW}Running $TEST_NAME...${NC}"
  
  # Run the test and capture the output
  if $TEST_COMMAND >> $DETAILED_LOG 2>&1; then
    log "${GREEN}✓ $TEST_NAME passed${NC}"
    return 0
  else
    log "${RED}✗ $TEST_NAME failed${NC}"
    log "See $DETAILED_LOG for details"
    return 1
  fi
}

# First, test the database connection
log "${YELLOW}Testing Database Connection...${NC}"
if node test-connection-fix.js >> $DETAILED_LOG 2>&1; then
  log "${GREEN}✓ Database connection successful${NC}"
else
  log "${RED}✗ Database connection failed${NC}"
  log "See $DETAILED_LOG for details"
  exit 1
fi

# Part 1: Database Tests
log "\n${YELLOW}=== Part 1: Database Tests ===${NC}"

# Run database tests
run_test "Database Tests" "./run-improved-db-tests.sh"
DB_TESTS_RESULT=$?

# Part 2: API Tests
log "\n${YELLOW}=== Part 2: API Tests ===${NC}"

# Run API tests
run_test "API Tests" "./run-improved-api-tests.sh"
API_TESTS_RESULT=$?

# Part 3: End-to-End Tests
log "\n${YELLOW}=== Part 3: End-to-End Tests ===${NC}"

# Apply resource optimization fix
log "${YELLOW}Applying Cypress resource optimization...${NC}"
if node cypress-resource-fix.js >> $DETAILED_LOG 2>&1; then
  log "${GREEN}✓ Resource optimization applied${NC}"
else
  log "${RED}✗ Failed to apply resource optimization${NC}"
  E2E_TESTS_RESULT=1
fi

# Set up test data
log "${YELLOW}Setting up test data...${NC}"
if node cypress/seedTestData.js >> $DETAILED_LOG 2>&1; then
  log "${GREEN}✓ Test data setup complete${NC}"
else
  log "${RED}✗ Failed to set up test data${NC}"
  E2E_TESTS_RESULT=1
fi

# Start the test server for Cypress tests
log "${YELLOW}Starting test server on port 3002...${NC}"
node start-test-server.js >> $DETAILED_LOG 2>&1 &
TEST_SERVER_PID=$!

# Give the server some time to start
log "${YELLOW}Waiting for server to start...${NC}"
sleep 5

# Check if the server is running
if curl -s http://localhost:3002 > /dev/null; then
  log "${GREEN}✓ Test server started successfully${NC}"
  SERVER_STARTED=true
else
  log "${RED}✗ Failed to start test server${NC}"
  SERVER_STARTED=false
  E2E_TESTS_RESULT=1
fi

# Run Cypress tests if the setup was successful and server is running
if [ "$E2E_TESTS_RESULT" != "1" ] && [ "$SERVER_STARTED" = "true" ]; then
  # Function to run a Cypress test
  run_cypress_test() {
    local test_name=$1
    local test_spec=$2
    local output_file="test-results/cypress-${test_name}.log"
    
    log "${YELLOW}Running ${test_name} tests...${NC}"
    
    # Run the test and capture output
    if npx cypress run --spec "${test_spec}" --browser chrome > ${output_file} 2>&1; then
      log "${GREEN}✓ ${test_name} tests passed${NC}"
      return 0
    else
      log "${RED}✗ ${test_name} tests failed${NC}"
      log "See ${output_file} for details"
      return 1
    fi
  }
  
  # Run shopping experience tests
  run_cypress_test "Shopping Experience" "cypress/e2e/shopping-experience.cy.js"
  SHOPPING_RESULT=$?
  
  # Run checkout tests
  run_cypress_test "Checkout" "cypress/e2e/checkout.cy.js"
  CHECKOUT_RESULT=$?
  
  # Run seller functionality tests
  run_cypress_test "Seller Functionality" "cypress/e2e/seller.cy.js"
  SELLER_RESULT=$?
  
  # Run wishlist and reviews tests
  run_cypress_test "Wishlist & Reviews" "cypress/e2e/wishlist-reviews.cy.js"
  WISHLIST_RESULT=$?
  
  # Run authentication tests
  run_cypress_test "Authentication" "cypress/e2e/auth.cy.js"
  AUTH_RESULT=$?
  
  # Run profile management tests
  run_cypress_test "Profile Management" "cypress/e2e/profile-management.cy.js"
  PROFILE_RESULT=$?
  
  # Determine overall E2E test result
  if [ "$SHOPPING_RESULT" = "0" ] && [ "$CHECKOUT_RESULT" = "0" ] && [ "$SELLER_RESULT" = "0" ] && [ "$WISHLIST_RESULT" = "0" ] && [ "$AUTH_RESULT" = "0" ] && [ "$PROFILE_RESULT" = "0" ]; then
    E2E_TESTS_RESULT=0
  else
    E2E_TESTS_RESULT=1
  fi
else
  E2E_TESTS_RESULT=1
fi

# Stop the test server if it was started
if [ "$SERVER_STARTED" = "true" ]; then
  log "${YELLOW}Stopping test server...${NC}"
  kill $TEST_SERVER_PID
  wait $TEST_SERVER_PID 2>/dev/null
  log "${GREEN}✓ Test server stopped${NC}"
fi

# Generate summary
log "\n${YELLOW}=== Test Summary ===${NC}"

# Database Tests Summary
if [ "$DB_TESTS_RESULT" = "0" ]; then
  log "${GREEN}✓ Database Tests: PASSED${NC}"
else
  log "${RED}✗ Database Tests: FAILED${NC}"
fi

# API Tests Summary
if [ "$API_TESTS_RESULT" = "0" ]; then
  log "${GREEN}✓ API Tests: PASSED${NC}"
else
  log "${RED}✗ API Tests: FAILED${NC}"
fi

# E2E Tests Summary
if [ "$E2E_TESTS_RESULT" = "0" ]; then
  log "${GREEN}✓ End-to-End Tests: PASSED${NC}"
else
  log "${RED}✗ End-to-End Tests: FAILED${NC}"
fi

# Overall Summary
if [ "$DB_TESTS_RESULT" = "0" ] && [ "$API_TESTS_RESULT" = "0" ] && [ "$E2E_TESTS_RESULT" = "0" ]; then
  log "\n${GREEN}All tests passed successfully!${NC}"
  OVERALL_RESULT=0
else
  log "\n${RED}Some tests failed. Please check the test results for details.${NC}"
  OVERALL_RESULT=1
fi

# Provide information about the detailed logs
log "\nDetailed logs are available in:"
log "- $DETAILED_LOG (all test output)"
log "- test-results/ directory (individual test logs)"

# Update the test results summary
cat > test-results-summary-improved.md << EOL
# VowSwapping MVP Test Results Summary (Improved)

## Database Tests

${DB_TESTS_RESULT == 0 ? "✅" : "❌"} **Database Tests**: ${DB_TESTS_RESULT == 0 ? "All database tests passed" : "Some database tests failed"}

## API Tests

${API_TESTS_RESULT == 0 ? "✅" : "❌"} **API Tests**: ${API_TESTS_RESULT == 0 ? "All API tests passed" : "Some API tests failed"}

## End-to-End Tests

${E2E_TESTS_RESULT == 0 ? "✅" : "❌"} **End-to-End Tests**: ${E2E_TESTS_RESULT == 0 ? "All end-to-end tests passed" : "Some end-to-end tests failed"}

## Summary

${OVERALL_RESULT == 0 ? "✅ All tests passed successfully!" : "❌ Some tests failed. Please check the test results for details."}

## Improvements Made

1. **Enhanced Database Connection Handling**:
   - Implemented unique schema names for each test run
   - Added connection pooling parameters to avoid prepared statement conflicts
   - Improved error handling and logging

2. **Isolated Test Environments**:
   - Each test suite runs in its own isolated database schema
   - Proper cleanup after tests to prevent resource leaks

3. **Better Test Organization**:
   - Separated tests into smaller, more focused suites
   - Improved logging and reporting

## Next Steps

1. Continue addressing specific test failures
2. Implement additional test cases for edge scenarios
3. Further optimize test performance
EOL

# Open the test results summary
log "\n${YELLOW}Opening test results summary...${NC}"
if [ "$(uname)" == "Darwin" ]; then
  # macOS
  open test-results-summary-improved.md
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  # Linux
  xdg-open test-results-summary-improved.md
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
  # Windows
  start test-results-summary-improved.md
fi

exit $OVERALL_RESULT
