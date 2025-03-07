#!/bin/bash

# Run a single Cypress test file using start-server-and-test
# Usage: ./run-single-cypress-test.sh [test-file]
# Example: ./run-single-cypress-test.sh cypress/e2e/auth.cy.js

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if a test file was provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No test file specified${NC}"
  echo -e "Usage: ./run-single-cypress-test.sh [test-file]"
  echo -e "Example: ./run-single-cypress-test.sh cypress/e2e/auth.cy.js"
  exit 1
fi

TEST_FILE=$1

# Check if the test file exists
if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}Error: Test file '$TEST_FILE' not found${NC}"
  exit 1
fi

echo -e "${YELLOW}=== Running Cypress Test: $TEST_FILE ===${NC}"
echo ""

# Apply resource optimization fix
echo -e "${YELLOW}Applying Cypress resource optimization...${NC}"
if node cypress-resource-fix.js; then
  echo -e "${GREEN}✓ Resource optimization applied${NC}"
else
  echo -e "${RED}✗ Failed to apply resource optimization${NC}"
  exit 1
fi

# Set up test data
echo -e "${YELLOW}Setting up test data...${NC}"
if node cypress/seedTestData.js; then
  echo -e "${GREEN}✓ Test data setup complete${NC}"
else
  echo -e "${RED}✗ Failed to set up test data${NC}"
  exit 1
fi

# Run the test using start-server-and-test
echo -e "${YELLOW}Starting server and running test...${NC}"
if npx start-server-and-test "npm run dev" http://localhost:3002 "cypress run --spec \"$TEST_FILE\" --browser chrome"; then
  echo -e "${GREEN}✓ Test passed${NC}"
  TEST_RESULT=0
else
  echo -e "${RED}✗ Test failed${NC}"
  echo -e "Check the Cypress screenshots and videos for details."
  TEST_RESULT=1
fi

exit $TEST_RESULT
