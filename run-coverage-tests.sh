#!/bin/bash

# Run all tests with coverage reporting
# This script runs all Jest tests and generates a detailed coverage report

# Set environment variables for testing
export NODE_ENV=test
export TEST_DATABASE_URL="file:./prisma/test-migrations.db"

# Create output directory for test results
mkdir -p test-results/coverage

echo "=== Running Jest tests with coverage reporting ==="

# Run Jest tests with coverage
npx jest --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=json --coverageDirectory=test-results/coverage

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "=== Tests completed successfully ==="
else
  echo "=== Tests failed ==="
  exit 1
fi

# Display coverage summary
echo "=== Coverage Summary ==="
cat test-results/coverage/coverage-summary.json | jq '.total'

# Check if coverage meets the threshold (70%)
STATEMENTS=$(cat test-results/coverage/coverage-summary.json | jq '.total.statements.pct')
BRANCHES=$(cat test-results/coverage/coverage-summary.json | jq '.total.branches.pct')
FUNCTIONS=$(cat test-results/coverage/coverage-summary.json | jq '.total.functions.pct')
LINES=$(cat test-results/coverage/coverage-summary.json | jq '.total.lines.pct')

echo "Statements: $STATEMENTS%"
echo "Branches: $BRANCHES%"
echo "Functions: $FUNCTIONS%"
echo "Lines: $LINES%"

# Check if all coverage metrics meet the threshold
if (( $(echo "$STATEMENTS >= 70" | bc -l) )) && \
   (( $(echo "$BRANCHES >= 70" | bc -l) )) && \
   (( $(echo "$FUNCTIONS >= 70" | bc -l) )) && \
   (( $(echo "$LINES >= 70" | bc -l) )); then
  echo "=== Coverage threshold met! ==="
  echo "All coverage metrics are at or above 70%"
else
  echo "=== Coverage threshold not met ==="
  echo "One or more coverage metrics are below 70%"
  
  # Identify which metrics are below threshold
  if (( $(echo "$STATEMENTS < 70" | bc -l) )); then
    echo "Statements coverage is below threshold: $STATEMENTS%"
  fi
  
  if (( $(echo "$BRANCHES < 70" | bc -l) )); then
    echo "Branches coverage is below threshold: $BRANCHES%"
  fi
  
  if (( $(echo "$FUNCTIONS < 70" | bc -l) )); then
    echo "Functions coverage is below threshold: $FUNCTIONS%"
  fi
  
  if (( $(echo "$LINES < 70" | bc -l) )); then
    echo "Lines coverage is below threshold: $LINES%"
  fi
  
  # Generate a report of files with low coverage
  echo "=== Files with low coverage ==="
  npx istanbul report text-summary
  
  echo "=== Detailed coverage report available in test-results/coverage/lcov-report/index.html ==="
fi

# Generate a detailed coverage report
echo "=== Generating detailed coverage report ==="
npx istanbul report html

echo "=== Test coverage analysis complete ==="
echo "Open test-results/coverage/lcov-report/index.html in your browser to view the detailed report"
