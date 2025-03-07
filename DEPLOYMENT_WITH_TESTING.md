# Deployment Guide with Testing

This guide outlines the steps to deploy the VowSwapping application with proper testing to ensure a stable release.

## Pre-Deployment Testing

Before deploying to production, follow these steps to ensure all tests pass:

1. **Apply Database Migrations**:
   ```bash
   # Apply the wishlist migration
   node apply-wishlist-migration.js
   
   # Apply the review migration
   node apply-review-migration.js
   ```

2. **Run All Tests**:
   ```bash
   # Run the complete test suite
   ./run-tests.sh
   ```

3. **Fix Any Failing Tests**:
   - Review the test output logs
   - Address any failing tests before proceeding with deployment
   - Refer to TESTING_FIXES.md for common issues and solutions

## Deployment Process

### 1. Prepare the Environment

Ensure your production environment variables are set correctly in `.env.production`:

```
DATABASE_URL=your_production_db_url
NEXTAUTH_URL=your_production_url
NEXTAUTH_SECRET=your_nextauth_secret
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 2. Build the Application

```bash
# Install dependencies
npm ci

# Build the application
npm run build
```

### 3. Deploy to Vercel

```bash
# Deploy using Vercel CLI
vercel --prod
```

Alternatively, you can set up automatic deployments from your GitHub repository.

### 4. Verify Deployment

After deployment, verify that:

1. The application is accessible at your production URL
2. User authentication works correctly
3. Product listings and search functionality work
4. Wishlist and cart operations function properly
5. Checkout process completes successfully
6. Seller functionality is operational

### 5. Post-Deployment Testing

Run a subset of tests against the production environment:

```bash
# Set the environment variable to point to production
export CYPRESS_BASE_URL=https://your-production-url.com

# Run critical path tests
npx cypress run --spec "cypress/e2e/shopping-experience.cy.js,cypress/e2e/checkout.cy.js" --browser chrome
```

## Rollback Procedure

If issues are detected after deployment:

1. **Immediate Rollback**:
   ```bash
   vercel rollback
   ```

2. **Diagnose Issues**:
   - Check server logs
   - Review error reports
   - Run tests against the production environment

3. **Fix and Redeploy**:
   - Fix the identified issues
   - Run the full test suite again
   - Deploy the fixed version

## Monitoring

Monitor the deployed application using:

1. **Vercel Analytics**: Review performance metrics and error rates
2. **Server Logs**: Check for unexpected errors or warnings
3. **User Feedback**: Monitor support channels for user-reported issues

## Troubleshooting Common Deployment Issues

### Database Connection Issues

- Verify that the `DATABASE_URL` in your environment variables is correct
- Check that the database server is accessible from your deployment environment
- Ensure database migrations have been applied correctly

### Authentication Problems

- Confirm that `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set correctly
- Verify that the authentication provider configurations are correct
- Check for CORS issues if using a separate API domain

### Payment Processing Failures

- Ensure Stripe keys are correctly configured
- Verify that the webhook endpoint is properly set up
- Test the payment flow in Stripe's test mode

### Image Upload Issues

- Check Cloudinary configuration
- Verify upload permissions and quotas
- Test image upload functionality in isolation

## Conclusion

Following this deployment guide with proper testing will help ensure a smooth release process. Always prioritize testing before deployment to catch issues early and provide a stable experience for your users.
