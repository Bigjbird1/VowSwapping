# Database Connection Fix for Vercel Deployment

## Issue

When trying to register a user on the deployed application, the following error occurred:

```
Registration error: Invalid `prisma.user.findUnique()` invocation: error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

## Root Cause

The error occurred because the database connection URL in the Vercel environment didn't have the required protocol prefix (`postgresql://` or `postgres://`) that Prisma requires. This happens because Vercel's PostgreSQL integration sometimes provides connection strings in a format that doesn't include the protocol prefix.

## Solution

Two changes were made to fix this issue:

1. **Updated `src/lib/prisma.ts`** to ensure the database URL always has the correct protocol prefix:
   - Added logic to check if the database URL starts with `postgresql://` or `postgres://`
   - If not, the code now adds the `postgresql://` prefix
   - Added better error handling for missing database URLs

2. **Updated `vercel.json`** to format the `DATABASE_URL` environment variable:
   - Changed from `"DATABASE_URL": "${POSTGRES_PRISMA_URL}"` to `"DATABASE_URL": "postgresql://${POSTGRES_PRISMA_URL#*@}"`
   - This uses shell parameter expansion to extract the part of the URL after the @ symbol and prepends the required protocol

## Deployment Instructions

To apply these fixes:

1. Push the changes to your repository
2. Redeploy your application on Vercel:
   - Go to your Vercel dashboard
   - Select the VowSwapping project
   - Click "Deployments" tab
   - Click "Redeploy" on the latest deployment or create a new deployment

## Verification

After redeploying, test the user registration functionality to ensure the database connection is working properly.
