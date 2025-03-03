#!/bin/bash

# This script is used to force a clean install on Vercel
# It can be run before deployment to ensure a fresh build

# Remove node_modules and package-lock.json
rm -rf node_modules
rm -f package-lock.json

# Update the clear-cache.js file with a new timestamp to force a new build
echo "// This script is used to clear the Vercel cache
// It's a simple empty file that can be committed to trigger a fresh build
// The timestamp below will change each time this file is updated

// Last updated: $(date)" > clear-cache.js

echo "Clean install preparation complete. Ready for deployment."
