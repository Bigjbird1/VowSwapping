#!/bin/bash

# Script to run all error handling tests

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Error Handling Tests...${NC}"
echo "======================================"

# Create a directory for test results if it doesn't exist
mkdir -p test-results

# Run all error handling tests
echo -e "${GREEN}Running Network Failure Tests...${NC}"
npx jest __tests__/error/network-failures.test.js --verbose

echo -e "${GREEN}Running Concurrency Tests...${NC}"
npx jest __tests__/error/concurrency.test.js --verbose

echo -e "${GREEN}Running Input Validation Tests...${NC}"
npx jest __tests__/error/input-validation.test.js --verbose

echo -e "${GREEN}Running Transaction Error Tests...${NC}"
npx jest __tests__/error/transaction-errors.test.js --verbose

echo -e "${GREEN}Running Security Error Tests...${NC}"
npx jest __tests__/error/security-errors.test.js --verbose

echo -e "${GREEN}Running Database Error Tests...${NC}"
npx jest __tests__/error/database-errors.test.js --verbose

echo -e "${GREEN}Running External Service Error Tests...${NC}"
npx jest __tests__/error/external-service-errors.test.js --verbose

echo -e "${GREEN}Running Original Error Handling Tests...${NC}"
npx jest __tests__/error/handling.test.js --verbose

# Run all error tests with coverage
echo -e "${YELLOW}Running All Error Tests with Coverage...${NC}"
npx jest __tests__/error/ --coverage --coverageDirectory=test-results/error-coverage

# Display coverage summary
echo -e "${YELLOW}Error Handling Test Coverage Summary:${NC}"
cat test-results/error-coverage/lcov-report/index.html | grep -A 5 "Total"

echo "======================================"
echo -e "${GREEN}Error Handling Tests Completed!${NC}"
