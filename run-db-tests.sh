#!/bin/bash

# Exit on error
set -e

echo "Running database tests..."

# Run jest with database test configuration
npx jest \
  --testPathPattern="__tests__/database" \
  --runInBand \
  --detectOpenHandles \
  --forceExit \
  database

echo "Database tests completed"
