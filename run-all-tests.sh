#!/bin/bash

# Run all tests for VowSwap

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== VowSwap Test Suite Runner ===${NC}"
echo ""

# Run database tests first
echo -e "${YELLOW}Running Database Integration Tests...${NC}"
./run-db-tests.sh || {
  echo -e "${RED}Database Integration Tests failed!${NC}"
  FAILED=true
}
echo ""

# Run API tests
echo -e "${YELLOW}Running API Tests...${NC}"
./run-api-tests.sh || {
  echo -e "${RED}API Tests failed!${NC}"
  FAILED=true
}
echo ""

echo -e "${YELLOW}Running Cypress E2E Tests...${NC}"
echo ""

# Create test results directory if it doesn't exist
mkdir -p test-results/cypress

# Apply resource optimization fix to address "spawn Unknown system error -86"
echo -e "${YELLOW}Applying Cypress resource optimization...${NC}"
node cypress-resource-fix.js || {
  echo -e "${RED}Failed to apply resource optimization!${NC}"
  FAILED=true
}
echo ""

# Run the seedTestData.js script to set up test fixtures
echo -e "${YELLOW}Setting up Cypress test data...${NC}"
node cypress/seedTestData.js || {
  echo -e "${RED}Failed to set up test data!${NC}"
  FAILED=true
}
echo ""

# Run all Cypress E2E tests with Chrome browser
# Start the development server and run Cypress tests
echo -e "${YELLOW}Starting development server and running all Cypress E2E tests with Chrome browser...${NC}"
npx start-server-and-test "npm run dev" http://localhost:3002 "cypress run --browser chrome" || {
  echo -e "${RED}Cypress E2E Tests failed!${NC}"
  FAILED=true
}
echo ""

# Check if any tests failed
if [ "$FAILED" = true ]; then
  echo -e "${RED}Some tests failed. Please check the test results for details.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
fi
