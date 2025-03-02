# VowSwap Deployment Instructions

## Configuration Required

Your Vercel deployment configuration needs the following environment variables:

### Stripe Integration (Phase 1)
1. ✅ STRIPE_SECRET_KEY
2. ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
3. ✅ STRIPE_WEBHOOK_SECRET

### Cloudinary Integration (Phase 2)
4. ⬜ CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name
5. ⬜ CLOUDINARY_API_KEY - Your Cloudinary API key
6. ⬜ CLOUDINARY_API_SECRET - Your Cloudinary API secret

### Database Configuration
7. ✅ DATABASE_URL - Your PostgreSQL connection string

## Next Steps

To deploy your application to Vercel:

1. Set up a Cloudinary account if you haven't already:
   - Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
   - Navigate to the Dashboard to find your cloud name, API key, and API secret
   - Create a folder named `vowswap` in your Cloudinary media library (optional)

2. Add the Cloudinary environment variables to your Vercel project:
   - Go to your Vercel project settings
   - Navigate to the "Environment Variables" section
   - Add the Cloudinary variables listed above

3. Commit and push the changes to your repository:

```bash
git add .
git commit -m "Complete Phase 2: Database-Backed Product Management"
git push -u origin main
```

4. Vercel should automatically detect the changes and start a new deployment.

5. Monitor the deployment in your Vercel dashboard to ensure it completes successfully.

## After Deployment

Once your application is deployed:

1. Test the payment flow by making a test purchase
2. Verify that the webhook is receiving events from Stripe
3. Check that orders are being created in your database
4. Test the admin dashboard functionality:
   - Navigate to `/admin` and verify you can access it when logged in
   - Try creating a new product with image uploads
   - Edit an existing product
   - Delete a product
5. Verify that Cloudinary image uploads are working correctly

## Security Considerations

The `vercel.json` file may contain sensitive API keys. If this is a public repository, consider:

1. Moving all environment variables to the Vercel dashboard instead
2. Adding `vercel.json` to your `.gitignore` file to prevent it from being committed

For Cloudinary security:
1. Restrict upload capabilities in your Cloudinary settings
2. Consider setting up upload presets with restrictions
3. Monitor your usage to stay within free tier limits if applicable

## Troubleshooting

If you encounter any issues:

1. Check the Vercel deployment logs for specific errors
2. Verify that all environment variables are correctly set
3. Ensure your Stripe account is properly configured
4. Test your webhook endpoint using Stripe's webhook testing tool
5. For Cloudinary issues:
   - Verify your API credentials are correct
   - Check that your account has sufficient upload capacity
   - Test image uploads with smaller images if you encounter size limits
6. For database issues:
   - Verify your database connection string is correct
   - Check that your Prisma schema matches your database schema
   - Run `npx prisma db push` locally to sync your schema if needed

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Phase 2 Features

The Phase 2 deployment includes:

1. Database-backed product management
2. Admin dashboard for product CRUD operations
3. Cloudinary integration for image uploads
4. Standardized database access with Prisma ORM

See `PHASE2_PROGRESS.md` for more details on what has been completed and what's coming next.
