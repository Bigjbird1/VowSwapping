#!/bin/bash

# Script to run tests with the fixes implemented
# This script runs each test partition separately and provides detailed output

# Set colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Running Fixed Tests ===${NC}"
echo -e "${YELLOW}This script will run each test partition separately to verify the fixes${NC}"
echo ""

# Create output directory if it doesn't exist
mkdir -p test-results

# Function to run a test and check its result
run_test() {
  local test_name=$1
  local test_path=$2
  local output_file="test-results/${test_name}.log"
  
  echo -e "${YELLOW}Running ${test_name} tests...${NC}"
  
  # Run the test and capture output
  npx jest ${test_path} --verbose > ${output_file} 2>&1
  
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

# 1. Run StarRating Component Tests
echo -e "\n${BLUE}=== 1. StarRating Component Tests ===${NC}"
run_test "StarRating" "__tests__/components/StarRating.test.jsx"
star_rating_result=$?

# 2. Run Database Test Setup Tests
echo -e "\n${BLUE}=== 2. Database Test Setup Tests ===${NC}"
run_test "DatabaseSetup" "__tests__/database/db-test-setup.test.js"
db_setup_result=$?

# 3. Run Users API Endpoint Tests
echo -e "\n${BLUE}=== 3. Users API Endpoint Tests ===${NC}"
run_test "UsersAPI" "__tests__/api/users.test.js"
users_api_result=$?

# 4. Run Database Migration Tests
echo -e "\n${BLUE}=== 4. Database Migration Tests ===${NC}"
run_test "Migrations" "__tests__/database/migrations.test.js"
migrations_result=$?

# 5. Run Data Persistence Tests
echo -e "\n${BLUE}=== 5. Data Persistence Tests ===${NC}"
run_test "DataPersistence" "__tests__/database/data-persistence.test.js"
data_persistence_result=$?

# 6. Run Prisma Models Tests
echo -e "\n${BLUE}=== 6. Prisma Models Tests ===${NC}"
run_test "PrismaModels" "__tests__/database/prisma-models.test.js"
prisma_models_result=$?

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
total_tests=6
passed_tests=0

# Count passed tests
[ $star_rating_result -eq 0 ] && ((passed_tests++))
[ $db_setup_result -eq 0 ] && ((passed_tests++))
[ $users_api_result -eq 0 ] && ((passed_tests++))
[ $migrations_result -eq 0 ] && ((passed_tests++))
[ $data_persistence_result -eq 0 ] && ((passed_tests++))
[ $prisma_models_result -eq 0 ] && ((passed_tests++))

# Display summary
echo -e "${YELLOW}Tests Passed: ${passed_tests}/${total_tests}${NC}"

# Display detailed results
echo -e "\n${BLUE}=== Detailed Results ===${NC}"
[ $star_rating_result -eq 0 ] && echo -e "${GREEN}✓ StarRating Component Tests${NC}" || echo -e "${RED}✗ StarRating Component Tests${NC}"
[ $db_setup_result -eq 0 ] && echo -e "${GREEN}✓ Database Test Setup Tests${NC}" || echo -e "${RED}✗ Database Test Setup Tests${NC}"
[ $users_api_result -eq 0 ] && echo -e "${GREEN}✓ Users API Endpoint Tests${NC}" || echo -e "${RED}✗ Users API Endpoint Tests${NC}"
[ $migrations_result -eq 0 ] && echo -e "${GREEN}✓ Database Migration Tests${NC}" || echo -e "${RED}✗ Database Migration Tests${NC}"
[ $data_persistence_result -eq 0 ] && echo -e "${GREEN}✓ Data Persistence Tests${NC}" || echo -e "${RED}✗ Data Persistence Tests${NC}"
[ $prisma_models_result -eq 0 ] && echo -e "${GREEN}✓ Prisma Models Tests${NC}" || echo -e "${RED}✗ Prisma Models Tests${NC}"

# Check if all tests passed
if [ $passed_tests -eq $total_tests ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Check the logs in the test-results directory for details.${NC}"
  exit 1
fi
