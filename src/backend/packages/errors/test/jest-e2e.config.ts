/**
 * Jest configuration for end-to-end tests of the error handling framework.
 * This configuration is specifically designed for testing error handling components
 * in a real NestJS application context with HTTP requests.
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
  
  // Longer timeout for HTTP requests and error handling tests (20 seconds)
  // This is important for tests that involve multiple HTTP requests and error propagation
  testTimeout: 20000,
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
  
  // Retry failed tests to handle flaky network conditions
  // This is especially important for tests that depend on HTTP requests
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
    '!<rootDir>/../src/**/*.module.ts',
    '!<rootDir>/../src/**/*.dto.ts',
    '!<rootDir>/../src/**/*.interface.ts',
    '!<rootDir>/../src/**/index.ts',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage/e2e',
  
  // Run tests in a single process rather than creating a worker pool
  // This is important for error handling tests to prevent interference
  runInBand: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether each individual test should be reported during the run
  // Helpful for debugging which tests are running/failing
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
    '^@austa/errors/(.*)$': '<rootDir>/../src/$1',
    '^@austa/errors$': '<rootDir>/../src',
    '^@austa/logging$': '<rootDir>/../../logging/src',
    '^@austa/tracing$': '<rootDir>/../../tracing/src',
    '^@austa/interfaces/(.*)$': '<rootDir>/../../interfaces/src/$1',
    '^@austa/interfaces$': '<rootDir>/../../interfaces/src',
    '^@app/(.*)$': '<rootDir>/../../../$1',
  },
  
  // Global variables available in all test files
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json',
      isolatedModules: true,
    },
    // Error handling specific configuration for tests
    __ERROR_HANDLING__: {
      // Enable detailed error stack traces in tests
      detailedStackTraces: true,
      // Enable journey-specific error context in tests
      journeyContext: true,
      // Test all error types across journeys
      testAllJourneys: true,
      // Test HTTP error responses
      testHttpResponses: true,
      // Test error serialization
      testSerialization: true,
    },
  },
  
  // Automatically restore mocks between tests
  restoreMocks: true,
  
  // Maximum number of workers to use for running tests
  // For error handling tests, limiting this can prevent interference
  maxWorkers: 1,
  
  // Force exit after all tests complete
  // This ensures that any hanging connections are terminated
  forceExit: true,
};

export default config;