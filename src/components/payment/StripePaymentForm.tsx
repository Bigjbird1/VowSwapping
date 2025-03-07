'use client';

import { useState, useEffect } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  Elements,
  LinkAuthenticationElement
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions, PaymentIntentResult } from '@stripe/stripe-js';

// Load Stripe outside of component to avoid recreating Stripe object on renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  returnUrl: string;
}

// Wrapper component that provides Stripe context
export function StripePaymentWrapper({ 
  clientSecret, 
  returnUrl 
}: PaymentFormProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm clientSecret={clientSecret} returnUrl={returnUrl} />
    </Elements>
  );
}

// The actual payment form component
export function StripePaymentForm({ 
  clientSecret, 
  returnUrl 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check for payment intent status on page load
    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then((result: PaymentIntentResult) => {
      if (result.error) {
        setMessage(result.error.message || "An error occurred");
        return;
      }
      
      const paymentIntent = result.paymentIntent;
      if (!paymentIntent) {
        setMessage("No payment intent found");
        return;
      }
      
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide your payment details.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, clientSecret]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: email,
      },
    });

    // This will only happen if there's an immediate error when confirming the payment
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <LinkAuthenticationElement
        id="link-authentication-element"
        onChange={(e) => setEmail(e.value.email)}
      />
      
      <PaymentElement id="payment-element" />
      
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className={`w-full bg-primary-600 text-white py-3 rounded-md font-medium hover:bg-primary-700 transition-colors ${
          isLoading ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        data-testid="pay-button"
      >
        <span id="button-text">
          {isLoading ? "Processing..." : "Pay now"}
        </span>
      </button>
      
      {message && (
        <div id="payment-message" className="text-center mt-4 text-sm">
          {message}
        </div>
      )}
    </form>
  );
}
