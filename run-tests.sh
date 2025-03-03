#!/bin/bash

# Run Tests and Generate Coverage Report
# This script runs all tests and generates a coverage report

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== VowSwap Testing Suite ===${NC}"
echo -e "${YELLOW}Running all tests and generating coverage report...${NC}"
echo ""

# Create a directory for test results if it doesn't exist
mkdir -p test-results

# Run Jest tests with coverage
echo -e "${YELLOW}Running Jest unit tests...${NC}"
npm test -- --coverage --coverageDirectory=./test-results/coverage

# Check if Jest tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Jest tests completed successfully${NC}"
else
  echo -e "${RED}✗ Jest tests failed${NC}"
fi

echo ""

# Run Cypress tests headlessly
echo -e "${YELLOW}Running Cypress E2E tests...${NC}"
echo -e "${YELLOW}Starting development server...${NC}"

# Start the development server in the background on port 3002
NEXT_PORT=3002 npm run dev > /dev/null 2>&1 &
DEV_SERVER_PID=$!

# Wait for the server to start
echo -e "${YELLOW}Waiting for development server to start on port 3002...${NC}"
sleep 10

# Run Cypress tests
npx cypress run --reporter mochawesome --reporter-options reportDir=test-results/cypress,overwrite=false,html=true,json=true

# Check if Cypress tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Cypress tests completed successfully${NC}"
else
  echo -e "${RED}✗ Cypress tests failed${NC}"
fi

# Kill the development server
kill $DEV_SERVER_PID

echo ""

# Run Lighthouse CI
echo -e "${YELLOW}Running Lighthouse CI tests...${NC}"
npm run lighthouse

# Check if Lighthouse tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Lighthouse tests completed successfully${NC}"
else
  echo -e "${RED}✗ Lighthouse tests failed${NC}"
fi

echo ""
echo -e "${GREEN}=== Testing Complete ===${NC}"
echo -e "${YELLOW}Test results and coverage reports are available in the test-results directory${NC}"
echo -e "${YELLOW}Jest coverage: test-results/coverage/lcov-report/index.html${NC}"
echo -e "${YELLOW}Cypress reports: test-results/cypress/mochawesome.html${NC}"
echo -e "${YELLOW}Lighthouse reports: .lighthouseci/reports/${NC}"
