# Setting Up Stripe Webhooks for VowSwap

This guide will walk you through the process of setting up a webhook endpoint in your Stripe dashboard and obtaining the webhook signing secret.

## Step 1: Log in to your Stripe Dashboard

Go to [https://dashboard.stripe.com/](https://dashboard.stripe.com/) and log in to your account.

## Step 2: Navigate to Webhooks

1. In the left sidebar, click on **Developers**
2. Then click on **Webhooks**

## Step 3: Add a Webhook Endpoint

1. Click the **+ Add endpoint** button
2. In the "Endpoint URL" field, enter your application's webhook URL:
   ```
   https://vowswapping.vercel.app/api/payments/webhook
   ```
   (Replace with your actual domain if different)

3. Under "Events to send", select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   
   You can add more events later if needed.

4. Click **Add endpoint** to create the webhook

## Step 4: Get the Webhook Signing Secret

After creating the webhook endpoint:

1. You'll be taken to the webhook details page
2. Click on the **Reveal** button next to "Signing secret"
3. This will show your webhook signing secret, which starts with `whsec_`
4. Copy this secret - you'll need it for your application

## Step 5: Update Your Vercel Configuration

Add the webhook secret to your `vercel.json` file:

```json
"STRIPE_WEBHOOK_SECRET": "whsec_your_copied_secret_here"
```

Or add it through the Vercel dashboard:
1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add a new variable with the name `STRIPE_WEBHOOK_SECRET` and the value you copied

## Testing Your Webhook

After deploying your application with the webhook secret:

1. Go back to the webhook details page in your Stripe dashboard
2. Click on the **Send test webhook** button
3. Select an event type (e.g., `payment_intent.succeeded`)
4. Click **Send test webhook**
5. Check the "Recent events" section to see if the test event was delivered successfully

## Troubleshooting

If your webhook isn't working:

1. Check the Vercel function logs for any errors
2. Verify that the webhook URL is correct and accessible
3. Ensure the webhook secret is correctly set in your environment variables
4. Check that your application is properly handling the webhook events

## Security Note

Keep your webhook secret secure and never expose it in client-side code. It should only be used on the server side to verify the authenticity of webhook events from Stripe.
