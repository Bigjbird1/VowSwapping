# Deployment Fix Guide

This document explains the changes made to fix the deployment issues with the VowSwapping application on Vercel.

## Issue

The deployment was failing with the error:

```
Module not found: Can't resolve 'date-fns'
```

This was happening despite the date-fns package being listed in the package.json dependencies. The issue was related to the version of date-fns (v4.1.0) potentially having compatibility issues with the Node.js version used by Vercel.

## Changes Made

1. **Downgraded date-fns**: Changed the version from `^4.1.0` to `^2.30.0` in package.json. The newer version (v4) might have compatibility issues with the Node.js version used by Vercel.

2. **Added .npmrc file**: Created a configuration file to ensure proper npm behavior during the build process with these settings:
   - `save-exact=false`: Ensures npm uses the latest versions within semver ranges
   - `package-lock=true`: Ensures package-lock.json is used

3. **Updated vercel.json**: Changed the installation command from `npm ci` to `npm install` to ensure compatibility with the package-lock.json file.

4. **Added .nvmrc file**: Specified Node.js version 18.x to ensure compatibility with all dependencies.

5. **Added cache-busting mechanism**: Created clear-cache.js and force-clean-install.sh to help clear the Vercel build cache when needed.

## Deployment Instructions

1. **Before deploying to Vercel**, you can run the force-clean-install script to ensure a clean installation:

   ```bash
   ./force-clean-install.sh
   ```

   This will:
   - Remove node_modules and package-lock.json
   - Update the clear-cache.js file with a new timestamp to force a new build

2. **Commit and push all changes** to your GitHub repository:

   ```bash
   git add .
   git commit -m "Fix deployment issues with date-fns"
   git push
   ```

3. **Deploy to Vercel** using your preferred method (GitHub integration, Vercel CLI, etc.)

## Troubleshooting

If you encounter any issues during deployment:

1. **Check the Vercel build logs** for specific error messages.

2. **Verify environment variables** are properly set in the Vercel dashboard.

3. **Try forcing a clean build** by running the force-clean-install.sh script and redeploying.

4. **Consider manually clearing the Vercel build cache** from the Vercel dashboard if issues persist.
