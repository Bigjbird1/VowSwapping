# VowSwap Deployment Instructions

## Configuration Complete

Your Vercel deployment configuration has been updated with all the necessary Stripe API keys:

1. ✅ STRIPE_SECRET_KEY
2. ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
3. ✅ STRIPE_WEBHOOK_SECRET

## Next Steps

To deploy your application to Vercel:

1. Commit and push the changes to your repository:

```bash
git add .
git commit -m "Add Stripe API keys and webhook secret for Vercel deployment"
git push -u origin main
```

2. Vercel should automatically detect the changes and start a new deployment.

3. Monitor the deployment in your Vercel dashboard to ensure it completes successfully.

## After Deployment

Once your application is deployed:

1. Test the payment flow by making a test purchase
2. Verify that the webhook is receiving events from Stripe
3. Check that orders are being created in your database

## Security Considerations

The `vercel.json` file now contains sensitive API keys. If this is a public repository, consider:

1. Moving these environment variables to the Vercel dashboard instead
2. Adding `vercel.json` to your `.gitignore` file to prevent it from being committed

## Troubleshooting

If you encounter any issues:

1. Check the Vercel deployment logs for specific errors
2. Verify that all environment variables are correctly set
3. Ensure your Stripe account is properly configured
4. Test your webhook endpoint using Stripe's webhook testing tool

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
