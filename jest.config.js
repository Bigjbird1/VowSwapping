const isDbTest = process.argv.some(arg => arg.includes('database'));
const { cleanup } = require('./prisma/ensure-test-schema');

module.exports = {
  testEnvironment: isDbTest ? 'node' : 'jsdom',
  globalSetup: isDbTest ? '<rootDir>/prisma/ensure-test-schema.js' : undefined,
  globalTeardown: isDbTest ? '<rootDir>/prisma/test-teardown.js' : undefined,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 60000, // Increased timeout for all tests to prevent false negatives
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    isDbTest ? undefined : '/__tests__/database/'
  ].filter(Boolean),
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid|next-auth|@next-auth|next|openid-client|jose|@panva/hkdf)/)'
  ],
  collectCoverage: true,
  testEnvironmentOptions: {
    url: 'http://localhost:3002'
  },
  
  globals: {
    'TEST_TYPE': isDbTest ? 'database' : 'component'
  },

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
