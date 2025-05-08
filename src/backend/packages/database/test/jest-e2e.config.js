/**
 * Jest configuration for end-to-end tests of the database package.
 * 
 * This configuration is specifically designed for tests that interact with a real
 * database. It sets up longer timeouts, retry policies, and database isolation
 * to ensure reliable test execution even with database operations.
 * 
 * Usage:
 * Run E2E tests with: `yarn test:e2e` or `npm run test:e2e`
 */

const path = require('path');

module.exports = {
  // Use the custom Prisma test environment for database tests
  testEnvironment: path.join(__dirname, 'prisma-test-environment.js'),
  
  // Root directory for the tests
  rootDir: path.join(__dirname, '..'),
  
  // Test file patterns
  testMatch: [
    '**/*.e2e-spec.ts',
    '**/*.e2e-test.ts',
    '**/e2e/**/*.spec.ts',
    '**/e2e/**/*.test.ts'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/**/*.module.ts'
  ],
  coverageDirectory: './coverage/e2e',
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
  
  // Longer timeout for database operations (30 seconds)
  testTimeout: 30000,
  
  // Setup and teardown scripts
  globalSetup: path.join(__dirname, 'global-setup.js'),
  globalTeardown: path.join(__dirname, 'global-teardown.js'),
  
  // Retry failed tests to handle flaky database connections
  // Only retry in CI environments to avoid masking real issues in development
  retry: process.env.CI ? 2 : 0,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Use a single worker for database tests to prevent conflicts
  // This can be overridden with --maxWorkers flag when running tests
  maxWorkers: process.env.CI ? 2 : 1,
  
  // Bail after a certain number of failures to prevent long test runs with many failures
  bail: process.env.CI ? 5 : 0,
  
  // Display individual test results with timing information
  displayName: {
    name: 'DATABASE-E2E',
    color: 'blue'
  },
  
  // Custom reporters for better CI integration
  reporters: [
    'default',
    process.env.CI ? ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'jest-e2e-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      suiteNameTemplate: '{filename}'
    }] : null
  ].filter(Boolean),
  
  // Setup files to run before each test file
  setupFilesAfterEnv: [
    path.join(__dirname, 'jest-setup.ts')
  ],
  
  // Environment variables for tests
  testEnvironmentOptions: {
    // Database configuration
    database: {
      // Use a separate database for E2E tests
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      // Automatically clean up test data after each test
      cleanupAfterTest: !process.env.PRESERVE_TEST_DATA,
      // Timeout for database operations (in milliseconds)
      operationTimeout: 10000,
      // Maximum connection pool size for tests
      poolSize: 5,
      // Retry options for database operations
      retry: {
        // Number of retries for failed operations
        attempts: 3,
        // Delay between retries (in milliseconds)
        delay: 1000,
        // Factor to increase delay with each retry
        factor: 2,
        // Maximum delay between retries (in milliseconds)
        maxDelay: 5000
      }
    },
    
    // Test isolation configuration
    isolation: {
      // Use a unique schema for each test file
      mode: 'schema-per-file',
      // Prefix for test schemas
      schemaPrefix: 'test_',
      // Clean up schemas after tests
      cleanup: true
    }
  },
  
  // Cache configuration
  cache: {
    // Enable Jest cache for faster reruns
    enabled: true,
    // Cache directory
    directory: path.join(__dirname, '..', '..', '..', '..', 'node_modules', '.cache', 'jest-e2e')
  },
  
  // Notification configuration (only for local development)
  notify: !process.env.CI,
  notifyMode: 'failure-change',
  
  // Watch configuration (for development)
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Prevent tests from printing to console unless they fail
  silent: process.env.CI === 'true',
  
  // Custom resolver for module imports
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@austa/(.*)$': '<rootDir>/../$1/src',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1'
  }
};