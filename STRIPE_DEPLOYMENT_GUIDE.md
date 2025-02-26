# Stripe Integration Deployment Guide for VowSwap

## Issue Identified

The deployment to Vercel is failing with the following error:

```
Error: Neither apiKey nor config.authenticator provided
```

This error occurs because the Stripe API keys are missing or using placeholder values in the Vercel environment configuration.

## Solution

### 1. Update Stripe API Keys in Vercel

You need to add your actual Stripe API keys to the Vercel environment variables. These have been added to your `vercel.json` file, but they currently contain placeholder values:

```json
"STRIPE_SECRET_KEY": "sk_test_your_stripe_secret_key",
"NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_your_stripe_publishable_key",
"STRIPE_WEBHOOK_SECRET": "whsec_your_stripe_webhook_secret"
```

You have two options to set these values:

#### Option A: Update vercel.json (Recommended for version control)

Replace the placeholder values in `vercel.json` with your actual Stripe API keys:

```json
"STRIPE_SECRET_KEY": "sk_test_51PQX...",
"NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_51PQX...",
"STRIPE_WEBHOOK_SECRET": "whsec_..."
```

#### Option B: Set environment variables in Vercel Dashboard

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add the following environment variables with your actual values:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### 2. Getting Your Stripe API Keys

If you don't have your Stripe API keys yet:

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to Developers > API keys
3. Copy your publishable key (starts with `pk_test_` or `pk_live_`)
4. Copy your secret key (starts with `sk_test_` or `sk_live_`)

### 3. Setting Up Stripe Webhook Secret

For the webhook secret:

1. In the Stripe Dashboard, go to Developers > Webhooks
2. Create a new webhook endpoint pointing to `https://vowswapping.vercel.app/api/payments/webhook`
3. Select the events you want to listen for (at minimum: `payment_intent.succeeded` and `payment_intent.payment_failed`)
4. After creating the webhook, you'll see a signing secret (starts with `whsec_`)
5. Use this as your `STRIPE_WEBHOOK_SECRET`

### 4. Redeploy Your Application

After updating the environment variables, redeploy your application:

```bash
git add .
git commit -m "Add Stripe API keys to vercel.json"
git push -u origin main
```

## Security Considerations

- **Never commit real API keys to public repositories**. If this is a public repository, consider using Vercel's dashboard to set environment variables instead.
- For production, use `pk_live_` and `sk_live_` keys instead of test keys.
- Regularly rotate your webhook secrets for enhanced security.

## Testing After Deployment

After successful deployment:

1. Make a test purchase with a [Stripe test card](https://stripe.com/docs/testing#cards)
2. Verify the payment is processed correctly
3. Check that the order is created in your database
4. Verify the webhook is receiving events from Stripe

## Troubleshooting

If you continue to experience issues:

1. Check the Vercel deployment logs for specific errors
2. Verify that all environment variables are correctly set
3. Ensure your Stripe account is properly configured
4. Test your webhook endpoint using Stripe's webhook testing tool
