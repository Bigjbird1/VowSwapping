#!/bin/bash

# Run all tests for VowSwap and generate a summary report

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== VowSwap Test Suite Runner ===${NC}"
echo ""

# Create test results directory if it doesn't exist
mkdir -p test-results

# Create a log file for the test output
LOG_FILE="test-output.log"
DETAILED_LOG="test-output-detailed.log"
PART1_LOG="test-output-part1.log"
PART2_LOG="test-output-part2.log"
PART3_LOG="test-output-part3.log"

# Clear previous log files
> $LOG_FILE
> $DETAILED_LOG
> $PART1_LOG
> $PART2_LOG
> $PART3_LOG

# Function to log messages to both console and log file
log() {
  echo -e "$1" | tee -a $LOG_FILE
  echo -e "$1" >> $DETAILED_LOG
}

# Function to run a test and log the result
run_test() {
  TEST_NAME=$1
  TEST_COMMAND=$2
  LOG_PART=$3
  
  log "${YELLOW}Running $TEST_NAME...${NC}"
  
  # Run the test and capture the output
  if $TEST_COMMAND >> $LOG_PART 2>&1; then
    log "${GREEN}✓ $TEST_NAME passed${NC}"
    return 0
  else
    log "${RED}✗ $TEST_NAME failed${NC}"
    return 1
  fi
}

# First, test the database connection
log "${YELLOW}Testing Database Connection...${NC}"
if node test-db-connection.js >> $DETAILED_LOG 2>&1; then
  log "${GREEN}✓ Database connection successful${NC}"
else
  log "${RED}✗ Database connection failed${NC}"
  log "See $DETAILED_LOG for details"
  exit 1
fi

# Part 1: Database Tests
log "\n${YELLOW}=== Part 1: Database Tests ===${NC}"

# Run database tests
run_test "Database Model Tests" "./run-db-tests.sh" $PART1_LOG
DB_TESTS_RESULT=$?

# Part 2: API Tests
log "\n${YELLOW}=== Part 2: API Tests ===${NC}"

# Run API tests
run_test "API Tests" "./run-api-tests.sh" $PART2_LOG
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
  # Run shopping experience tests
  run_test "Shopping Experience Tests" "npx cypress run --spec 'cypress/e2e/shopping-experience.cy.js' --browser chrome" $PART3_LOG
  SHOPPING_RESULT=$?
  
  # Run checkout tests
  run_test "Checkout Tests" "npx cypress run --spec 'cypress/e2e/checkout.cy.js' --browser chrome" $PART3_LOG
  CHECKOUT_RESULT=$?
  
  # Run seller functionality tests
  run_test "Seller Functionality Tests" "npx cypress run --spec 'cypress/e2e/seller.cy.js' --browser chrome" $PART3_LOG
  SELLER_RESULT=$?
  
  # Run wishlist and reviews tests
  run_test "Wishlist & Reviews Tests" "npx cypress run --spec 'cypress/e2e/wishlist-reviews.cy.js' --browser chrome" $PART3_LOG
  WISHLIST_RESULT=$?
  
  # Run authentication tests
  run_test "Authentication Tests" "npx cypress run --spec 'cypress/e2e/auth.cy.js' --browser chrome" $PART3_LOG
  AUTH_RESULT=$?
  
  # Run profile management tests
  run_test "Profile Management Tests" "npx cypress run --spec 'cypress/e2e/profile-management.cy.js' --browser chrome" $PART3_LOG
  PROFILE_RESULT=$?
  
  # Determine overall E2E test result
  if [ "$SHOPPING_RESULT" = "0" ] && [ "$CHECKOUT_RESULT" = "0" ] && [ "$SELLER_RESULT" = "0" ] && [ "$WISHLIST_RESULT" = "0" ] && [ "$AUTH_RESULT" = "0" ] && [ "$PROFILE_RESULT" = "0" ]; then
    E2E_TESTS_RESULT=0
  else
    E2E_TESTS_RESULT=1
  fi
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
log "- $PART1_LOG (database tests)"
log "- $PART2_LOG (API tests)"
log "- $PART3_LOG (end-to-end tests)"

# Open the test results summary
log "\n${YELLOW}Opening test results summary...${NC}"
if [ "$(uname)" == "Darwin" ]; then
  # macOS
  open test-results-summary.md
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  # Linux
  xdg-open test-results-summary.md
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
  # Windows
  start test-results-summary.md
fi

exit $OVERALL_RESULT
