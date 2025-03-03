module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/products/1',
        'http://localhost:3000/cart',
        'http://localhost:3000/checkout',
        'http://localhost:3000/auth/signin',
        'http://localhost:3000/auth/signup',
        'http://localhost:3000/profile',
        'http://localhost:3000/seller/dashboard',
        'http://localhost:3000/shops'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 4,
          downloadThroughputKbps: 1500,
          uploadThroughputKbps: 750,
          rttMs: 40
        }
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // Specific assertions
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        
        // Accessibility assertions
        'aria-allowed-attr': ['error'],
        'aria-required-attr': ['error'],
        'aria-required-children': ['error'],
        'aria-required-parent': ['error'],
        'aria-roles': ['error'],
        'aria-valid-attr-value': ['error'],
        'aria-valid-attr': ['error'],
        'button-name': ['error'],
        'color-contrast': ['error'],
        'document-title': ['error'],
        'html-has-lang': ['error'],
        'image-alt': ['error'],
        'link-name': ['error'],
        'list': ['error'],
        'listitem': ['error'],
        'meta-viewport': ['error']
      }
    }
  }
};
