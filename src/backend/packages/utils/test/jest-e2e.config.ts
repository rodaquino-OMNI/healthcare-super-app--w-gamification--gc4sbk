/**
 * Jest configuration for end-to-end tests of the utils package.
 * This configuration is specifically designed for testing utility functions
 * in real application contexts across different journeys.
 */
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Specify which file extensions Jest should look for
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // The root directory where Jest should scan for tests
  rootDir: '.',
  
  // The pattern to detect E2E test files
  testRegex: '\.e2e-spec\.ts$',
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  
  // Longer timeout for E2E tests (15 seconds)
  // This is important for tests that involve real network requests or database operations
  testTimeout: 15000,
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
  
  // Retry failed tests to handle flaky conditions
  retry: 2,
  
  // Verbose output to help with debugging
  verbose: true,
  
  // Collect coverage information
  collectCoverage: false,
  
  // When enabled, coverage will only be collected from files matching the specified glob pattern
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.ts',
    '!<rootDir>/../src/**/*.spec.ts',
    '!<rootDir>/../src/**/*.e2e-spec.ts',
    '!<rootDir>/../src/**/*.mock.ts',
    '!<rootDir>/../src/**/index.ts',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage/e2e',
  
  // Run tests in a single process rather than creating a worker pool
  // This helps prevent interference between tests that might share resources
  runInBand: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether each individual test should be reported during the run
  reporters: ['default', 'jest-junit'],
  
  // Configure Jest JUnit reporter for CI integration
  reporterOptions: {
    junitReporter: {
      outputDirectory: '<rootDir>/../reports/junit',
      outputName: 'e2e-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
    },
  },
  
  // Module name mapper for resolving imports in tests
  moduleNameMapper: {
    '^@austa/utils/(.*)$': '<rootDir>/../src/$1',
    '^@austa/utils$': '<rootDir>/../src',
    '^@austa/interfaces/(.*)$': '<rootDir>/../../interfaces/src/$1',
    '^@austa/interfaces$': '<rootDir>/../../interfaces/src',
    '^@austa/errors$': '<rootDir>/../../errors/src',
    '^@austa/logging$': '<rootDir>/../../logging/src',
    '^@austa/tracing$': '<rootDir>/../../tracing/src',
    '^@austa/database$': '<rootDir>/../../database/src',
    '^@app/(.*)$': '<rootDir>/../../../$1',
  },
  
  // Global variables available in all test files
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json',
      isolatedModules: true,
    },
    // Utils-specific configuration for tests
    __UTILS_TESTING__: {
      // Enable cross-journey testing
      crossJourneyTesting: true,
      // Test with real HTTP requests
      realHttpRequests: false,
      // Test with real date/time operations
      realDateOperations: true,
      // Test validation with real schemas
      realValidation: true,
      // Enable extended test matchers
      extendedMatchers: true,
    },
  },
  
  // Automatically restore mocks between tests
  restoreMocks: true,
  
  // Maximum number of workers to use for running tests
  // For E2E tests, limiting this can prevent resource contention
  maxWorkers: 2,
  
  // Force exit after all tests complete
  // This ensures that any hanging connections are terminated
  forceExit: true,
  
  // Test environment variables
  testEnvironmentOptions: {
    // Set NODE_ENV to 'test' for E2E tests
    NODE_ENV: 'test',
    // Disable certain features in test environment
    DISABLE_LOGGING: 'true',
    // Use test databases and services
    USE_TEST_SERVICES: 'true',
    // Set timeout for test operations
    TEST_TIMEOUT_MS: '15000',
  },
};

export default config;