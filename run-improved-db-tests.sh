#!/bin/bash

# Exit on error
set -e

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running database tests with improved connection handling...${NC}"

# Create test results directory if it doesn't exist
mkdir -p test-results

# First, test the database connection with our improved script
echo -e "${YELLOW}Testing database connection...${NC}"
if node test-connection-fix.js; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Database connection failed${NC}"
  echo "See output for details"
  exit 1
fi

# Run Jest with database test configuration
# Use --runInBand to run tests serially (avoid connection conflicts)
# Use --detectOpenHandles to detect open handles
# Use --forceExit to force Jest to exit after all tests complete
echo -e "${YELLOW}Running database model tests...${NC}"
npx jest \
  --testPathPattern="__tests__/database" \
  --runInBand \
  --detectOpenHandles \
  --forceExit \
  --testTimeout=30000 \
  --setupFilesAfterEnv=./__tests__/database/improved-db-setup.js \
  database > test-results/DatabaseTests.log 2>&1

# Check if the tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database tests passed${NC}"
else
  echo -e "${RED}✗ Database tests failed${NC}"
  echo "See test-results/DatabaseTests.log for details"
  exit 1
fi

echo -e "${GREEN}Database tests completed successfully${NC}"
