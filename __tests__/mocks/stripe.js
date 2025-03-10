/**
 * Mock implementation of Stripe for testing
 */

// Mock Stripe client
export const stripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    capture: jest.fn(),
    cancel: jest.fn(),
    confirm: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    listPaymentMethods: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
};

// Mock Stripe errors
export class StripeError extends Error {
  constructor(message, type, code = null, param = null, detail = null) {
    super(message);
    this.name = 'StripeError';
    this.type = type;
    this.code = code;
    this.param = param;
    this.detail = detail;
  }
}

export class StripeCardError extends StripeError {
  constructor(message, code = null, param = null, detail = null, decline_code = null) {
    super(message, 'StripeCardError', code, param, detail);
    this.decline_code = decline_code;
  }
}

export class StripeInvalidRequestError extends StripeError {
  constructor(message, code = null, param = null, detail = null) {
    super(message, 'StripeInvalidRequestError', code, param, detail);
  }
}

export class StripeAPIError extends StripeError {
  constructor(message, code = null, detail = null) {
    super(message, 'StripeAPIError', code, null, detail);
    this.http_status = 500;
  }
}

export class StripeAuthenticationError extends StripeError {
  constructor(message) {
    super(message, 'StripeAuthenticationError');
    this.http_status = 401;
  }
}

export class StripePermissionError extends StripeError {
  constructor(message) {
    super(message, 'StripePermissionError');
    this.http_status = 403;
  }
}

export class StripeRateLimitError extends StripeError {
  constructor(message, code = null) {
    super(message, 'StripeRateLimitError', code);
    this.headers = { 'retry-after': '30' };
  }
}

export class StripeConnectionError extends StripeError {
  constructor(message) {
    super(message, 'StripeConnectionError');
    this.http_status = 503;
  }
}

export class StripeSignatureVerificationError extends StripeError {
  constructor(message, signature, payload) {
    super(message, 'StripeSignatureVerificationError');
    this.header = signature;
    this.payload = payload;
  }
}

// Helper function to create mock payment intent
export function createMockPaymentIntent(options = {}) {
  const {
    id = `pi_${Math.random().toString(36).substring(2, 15)}`,
    amount = 1000,
    currency = 'usd',
    status = 'succeeded',
    customer = null,
    payment_method = null,
    created = Date.now() / 1000,
    client_secret = `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`,
  } = options;

  return {
    id,
    object: 'payment_intent',
    amount,
    amount_capturable: 0,
    amount_received: amount,
    application: null,
    application_fee_amount: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: 'automatic',
    charges: {
      object: 'list',
      data: [
        {
          id: `ch_${Math.random().toString(36).substring(2, 15)}`,
          object: 'charge',
          amount,
          currency,
          status: 'succeeded',
        },
      ],
      has_more: false,
      total_count: 1,
      url: `/v1/charges?payment_intent=${id}`,
    },
    client_secret,
    confirmation_method: 'automatic',
    created,
    currency,
    customer,
    description: null,
    invoice: null,
    last_payment_error: null,
    livemode: false,
    metadata: {},
    next_action: null,
    on_behalf_of: null,
    payment_method,
    payment_method_options: {},
    payment_method_types: ['card'],
    receipt_email: null,
    review: null,
    setup_future_usage: null,
    shipping: null,
    source: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status,
    transfer_data: null,
    transfer_group: null,
  };
}

// Helper function to create mock customer
export function createMockCustomer(options = {}) {
  const {
    id = `cus_${Math.random().toString(36).substring(2, 15)}`,
    email = 'customer@example.com',
    name = 'Test Customer',
    created = Date.now() / 1000,
  } = options;

  return {
    id,
    object: 'customer',
    address: null,
    balance: 0,
    created,
    currency: null,
    default_source: null,
    delinquent: false,
    description: null,
    discount: null,
    email,
    invoice_prefix: Math.random().toString(36).substring(2, 8),
    invoice_settings: {
      custom_fields: null,
      default_payment_method: null,
      footer: null,
    },
    livemode: false,
    metadata: {},
    name,
    phone: null,
    preferred_locales: [],
    shipping: null,
    tax_exempt: 'none',
  };
}

// Helper function to create mock checkout session
export function createMockCheckoutSession(options = {}) {
  const {
    id = `cs_${Math.random().toString(36).substring(2, 15)}`,
    amount_total = 1000,
    currency = 'usd',
    customer = null,
    payment_intent = null,
    payment_status = 'paid',
    url = `https://checkout.stripe.com/pay/${Math.random().toString(36).substring(2, 15)}`,
  } = options;

  return {
    id,
    object: 'checkout.session',
    after_expiration: null,
    allow_promotion_codes: null,
    amount_subtotal: amount_total,
    amount_total,
    automatic_tax: { enabled: false, status: null },
    billing_address_collection: null,
    cancel_url: 'https://example.com/cancel',
    client_reference_id: null,
    consent: null,
    consent_collection: null,
    currency,
    customer,
    customer_details: {
      email: 'customer@example.com',
      phone: null,
      tax_exempt: 'none',
      tax_ids: [],
    },
    customer_email: null,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    livemode: false,
    locale: null,
    metadata: {},
    mode: 'payment',
    payment_intent,
    payment_method_options: {},
    payment_method_types: ['card'],
    payment_status,
    phone_number_collection: { enabled: false },
    recovered_from: null,
    setup_intent: null,
    shipping: null,
    shipping_address_collection: null,
    shipping_options: [],
    shipping_rate: null,
    status: 'complete',
    submit_type: null,
    subscription: null,
    success_url: 'https://example.com/success',
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0,
    },
    url,
  };
}

// Default export for jest.mock
export default {
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
  createMockCheckoutSession,
};
