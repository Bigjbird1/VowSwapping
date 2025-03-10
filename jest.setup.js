import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}

// Only mock PrismaClient for component tests, not database tests
const isDbTest = process.env.TEST_TYPE === 'database';

// Conditionally mock PrismaClient
!isDbTest && jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    wishlist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn().mockImplementation(async () => {
      if (options?.body) {
        return JSON.parse(options.body);
      }
      return {};
    }),
    nextUrl: new URL(url),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      status: options?.status || 200,
      json: async () => data,
    })),
    redirect: jest.fn().mockImplementation((url) => ({
      url,
      status: 302,
      json: async () => ({}),
    })),
  },
}));

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock Stripe
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  useStripe: () => ({
    confirmPayment: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(),
  }),
  PaymentElement: () => null,
}));

// Mock Stripe server-side library
jest.mock('stripe', () => {
  const stripeMock = require('./__tests__/mocks/stripe').default;
  return jest.fn(() => stripeMock.stripe);
});

// Mock our own stripe.ts module
jest.mock('@/lib/stripe', () => {
  const stripeMock = require('./__tests__/mocks/stripe');
  return {
    stripe: stripeMock.stripe,
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    createCheckoutSession: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };
});

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Patch StorageEvent for tests that use localStorage events
try {
  const { patchStorageEvent } = require('./__tests__/mocks/storage-event');
  patchStorageEvent();
} catch (error) {
  console.warn('Failed to patch StorageEvent:', error);
}

// Check if window is defined (browser environment) or not (Node.js environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
} else {
  // In Node.js environment, define window as a global object
  global.window = {
    localStorage: localStorageMock,
    matchMedia: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  };
}

// Mock Cloudinary
jest.mock('cloudinary', () => {
  const cloudinaryMock = require('./__tests__/mocks/cloudinary').default;
  return cloudinaryMock;
});

// Mock nodemailer
jest.mock('nodemailer', () => {
  const nodemailerMock = require('./__tests__/mocks/nodemailer').default;
  return nodemailerMock;
});

// Mock Cloudinary environment variables
process.env.CLOUDINARY_CLOUD_NAME = 'demo';
process.env.CLOUDINARY_API_KEY = 'mock-api-key';
process.env.CLOUDINARY_API_SECRET = 'mock-api-secret';

// Mock Email environment variables
process.env.EMAIL_SERVER_HOST = 'smtp.example.com';
process.env.EMAIL_SERVER_PORT = '587';
process.env.EMAIL_SERVER_USER = 'test@example.com';
process.env.EMAIL_SERVER_PASSWORD = 'mock-password';
process.env.EMAIL_FROM = 'noreply@vowswap.com';

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Enhanced fetch API mock for tests
if (!global.fetch) {
  const createResponse = (options = {}) => {
    const {
      status = 200,
      statusText = 'OK',
      headers = {},
      body = {},
      ok = status >= 200 && status < 300,
    } = options;

    const responseHeaders = new Headers(headers);
    
    const responseBody = typeof body === 'string' ? body : JSON.stringify(body);
    
    return {
      ok,
      status,
      statusText,
      headers: responseHeaders,
      json: jest.fn().mockResolvedValue(typeof body === 'string' ? JSON.parse(body) : body),
      text: jest.fn().mockResolvedValue(responseBody),
      blob: jest.fn().mockResolvedValue(new Blob([responseBody])),
      arrayBuffer: jest.fn().mockResolvedValue(new TextEncoder().encode(responseBody).buffer),
      formData: jest.fn().mockRejectedValue(new Error('Not implemented')),
      clone: function() { return this; },
      url: 'https://mock-fetch-url.com',
      redirected: false,
      type: 'basic',
      bodyUsed: false,
    };
  };

  global.fetch = jest.fn().mockImplementation((url, options = {}) => {
    // Default to success response
    return Promise.resolve(createResponse({
      status: 200,
      body: {},
      headers: options?.headers || {},
    }));
  });

  // Add helper methods to mock different responses
  global.fetch.mockSuccess = (body = {}) => {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve(createResponse({ body }))
    );
  };

  global.fetch.mockError = (status = 400, body = { error: 'Bad request' }) => {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve(createResponse({ status, body, ok: false }))
    );
  };

  global.fetch.mockNetworkError = () => {
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
  };

  global.fetch.mockTimeout = () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );
  };
}

// Mock AbortController if not available
if (typeof AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        onabort: null,
        reason: undefined,
        throwIfAborted: jest.fn(),
      };
    }
    abort() {
      this.signal.aborted = true;
      if (typeof this.signal.onabort === 'function') {
        this.signal.onabort();
      }
    }
  };
}

// Mock Headers if not available
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value);
        });
      }
    }
    
    append(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    
    delete(name) {
      this._headers.delete(name.toLowerCase());
    }
    
    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }
    
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
    
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    
    entries() {
      return this._headers.entries();
    }
    
    keys() {
      return this._headers.keys();
    }
    
    values() {
      return this._headers.values();
    }
    
    forEach(callback, thisArg) {
      this._headers.forEach((value, key) => {
        callback.call(thisArg, value, key, this);
      });
    }
  };
}
