/**
 * Tests for stripe.js mock
 */

import stripeMock, {
  stripe,
  StripeError,
  StripeCardError,
  StripeInvalidRequestError,
  StripeAPIError,
  StripeAuthenticationError,
  StripePermissionError,
  StripeRateLimitError,
  StripeConnectionError,
  StripeSignatureVerificationError,
  createMockPaymentIntent,
  createMockCustomer,
  createMockCheckoutSession
} from './stripe';

describe('Stripe Mock', () => {
  describe('stripe client', () => {
    it('should have payment intents methods', () => {
      expect(stripe.paymentIntents.create).toBeDefined();
      expect(stripe.paymentIntents.retrieve).toBeDefined();
      expect(stripe.paymentIntents.update).toBeDefined();
      expect(stripe.paymentIntents.capture).toBeDefined();
      expect(stripe.paymentIntents.cancel).toBeDefined();
      expect(stripe.paymentIntents.confirm).toBeDefined();
    });

    it('should have customers methods', () => {
      expect(stripe.customers.create).toBeDefined();
      expect(stripe.customers.retrieve).toBeDefined();
      expect(stripe.customers.update).toBeDefined();
      expect(stripe.customers.listPaymentMethods).toBeDefined();
    });

    it('should have checkout sessions methods', () => {
      expect(stripe.checkout.sessions.create).toBeDefined();
      expect(stripe.checkout.sessions.retrieve).toBeDefined();
    });

    it('should have webhooks methods', () => {
      expect(stripe.webhooks.constructEvent).toBeDefined();
    });

    it('should have refunds methods', () => {
      expect(stripe.refunds.create).toBeDefined();
    });

    it('should allow mocking method responses', async () => {
      const mockPaymentIntent = { id: 'pi_123', status: 'succeeded' };
      stripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);
      
      const result = await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd'
      });
      
      expect(result).toEqual(mockPaymentIntent);
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd'
      });
    });

    it('should allow mocking method rejections', async () => {
      const mockError = new StripeCardError('Card declined', 'card_declined');
      stripe.paymentIntents.confirm.mockRejectedValueOnce(mockError);
      
      await expect(stripe.paymentIntents.confirm('pi_123')).rejects.toThrow('Card declined');
      expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123');
    });
  });

  describe('Stripe Error Classes', () => {
    it('should create a base StripeError', () => {
      const error = new StripeError('Generic error', 'generic_type', 'error_code');
      expect(error.name).toBe('StripeError');
      expect(error.message).toBe('Generic error');
      expect(error.type).toBe('generic_type');
      expect(error.code).toBe('error_code');
    });

    it('should create a StripeCardError with decline code', () => {
      const error = new StripeCardError('Card declined', 'card_declined', 'param', 'detail', 'insufficient_funds');
      expect(error.name).toBe('StripeError');
      expect(error.type).toBe('StripeCardError');
      expect(error.code).toBe('card_declined');
      expect(error.param).toBe('param');
      expect(error.detail).toBe('detail');
      expect(error.decline_code).toBe('insufficient_funds');
    });

    it('should create a StripeInvalidRequestError', () => {
      const error = new StripeInvalidRequestError('Invalid parameter', 'invalid_param', 'amount');
      expect(error.type).toBe('StripeInvalidRequestError');
      expect(error.code).toBe('invalid_param');
      expect(error.param).toBe('amount');
    });

    it('should create a StripeAPIError with http status', () => {
      const error = new StripeAPIError('API error', 'api_error');
      expect(error.type).toBe('StripeAPIError');
      expect(error.http_status).toBe(500);
    });

    it('should create a StripeAuthenticationError', () => {
      const error = new StripeAuthenticationError('Invalid API key');
      expect(error.type).toBe('StripeAuthenticationError');
      expect(error.http_status).toBe(401);
    });

    it('should create a StripePermissionError', () => {
      const error = new StripePermissionError('Permission denied');
      expect(error.type).toBe('StripePermissionError');
      expect(error.http_status).toBe(403);
    });

    it('should create a StripeRateLimitError with retry header', () => {
      const error = new StripeRateLimitError('Rate limit exceeded', 'rate_limit');
      expect(error.type).toBe('StripeRateLimitError');
      expect(error.headers['retry-after']).toBe('30');
    });

    it('should create a StripeConnectionError', () => {
      const error = new StripeConnectionError('Connection error');
      expect(error.type).toBe('StripeConnectionError');
      expect(error.http_status).toBe(503);
    });

    it('should create a StripeSignatureVerificationError', () => {
      const error = new StripeSignatureVerificationError('Invalid signature', 'sig_123', '{}');
      expect(error.type).toBe('StripeSignatureVerificationError');
      expect(error.header).toBe('sig_123');
      expect(error.payload).toBe('{}');
    });
  });

  describe('Helper Functions', () => {
    describe('createMockPaymentIntent', () => {
      it('should create a payment intent with default values', () => {
        const paymentIntent = createMockPaymentIntent();
        expect(paymentIntent.object).toBe('payment_intent');
        expect(paymentIntent.amount).toBe(1000);
        expect(paymentIntent.currency).toBe('usd');
        expect(paymentIntent.status).toBe('succeeded');
        expect(paymentIntent.client_secret).toBeDefined();
        expect(paymentIntent.charges.data.length).toBe(1);
      });

      it('should override default values with provided options', () => {
        const options = {
          id: 'pi_custom',
          amount: 2000,
          currency: 'eur',
          status: 'requires_payment_method',
          customer: 'cus_123',
          payment_method: 'pm_123'
        };
        
        const paymentIntent = createMockPaymentIntent(options);
        
        expect(paymentIntent.id).toBe('pi_custom');
        expect(paymentIntent.amount).toBe(2000);
        expect(paymentIntent.currency).toBe('eur');
        expect(paymentIntent.status).toBe('requires_payment_method');
        expect(paymentIntent.customer).toBe('cus_123');
        expect(paymentIntent.payment_method).toBe('pm_123');
      });
    });

    describe('createMockCustomer', () => {
      it('should create a customer with default values', () => {
        const customer = createMockCustomer();
        expect(customer.object).toBe('customer');
        expect(customer.email).toBe('customer@example.com');
        expect(customer.name).toBe('Test Customer');
        expect(customer.created).toBeDefined();
      });

      it('should override default values with provided options', () => {
        const options = {
          id: 'cus_custom',
          email: 'custom@example.com',
          name: 'Custom Name'
        };
        
        const customer = createMockCustomer(options);
        
        expect(customer.id).toBe('cus_custom');
        expect(customer.email).toBe('custom@example.com');
        expect(customer.name).toBe('Custom Name');
      });
    });

    describe('createMockCheckoutSession', () => {
      it('should create a checkout session with default values', () => {
        const session = createMockCheckoutSession();
        expect(session.object).toBe('checkout.session');
        expect(session.amount_total).toBe(1000);
        expect(session.currency).toBe('usd');
        expect(session.payment_status).toBe('paid');
        expect(session.url).toBeDefined();
      });

      it('should override default values with provided options', () => {
        const options = {
          id: 'cs_custom',
          amount_total: 5000,
          currency: 'gbp',
          customer: 'cus_123',
          payment_intent: 'pi_123',
          payment_status: 'unpaid',
          url: 'https://custom-url.com'
        };
        
        const session = createMockCheckoutSession(options);
        
        expect(session.id).toBe('cs_custom');
        expect(session.amount_total).toBe(5000);
        expect(session.currency).toBe('gbp');
        expect(session.customer).toBe('cus_123');
        expect(session.payment_intent).toBe('pi_123');
        expect(session.payment_status).toBe('unpaid');
        expect(session.url).toBe('https://custom-url.com');
      });
    });
  });

  describe('Default Export', () => {
    it('should export all components', () => {
      expect(stripeMock.stripe).toBe(stripe);
      expect(stripeMock.StripeError).toBe(StripeError);
      expect(stripeMock.StripeCardError).toBe(StripeCardError);
      expect(stripeMock.createMockPaymentIntent).toBe(createMockPaymentIntent);
      expect(stripeMock.createMockCustomer).toBe(createMockCustomer);
      expect(stripeMock.createMockCheckoutSession).toBe(createMockCheckoutSession);
    });
  });
});
