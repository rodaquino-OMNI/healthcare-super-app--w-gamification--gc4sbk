/**
 * Jest configuration for the @austa/tracing package tests.
 * 
 * This configuration ensures proper test execution for unit, integration, and e2e tests
 * with appropriate settings for OpenTelemetry context propagation and async operations.
 */
module.exports = {
  // Root directory for the package
  rootDir: '../',

  // Test environment
  testEnvironment: 'node',

  // Setup and teardown files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  globalTeardown: '<rootDir>/test/teardown.ts',

  // Test patterns
  testMatch: [
    '<rootDir>/test/unit/**/*.spec.ts',
    '<rootDir>/test/integration/**/*.integration.spec.ts',
  ],

  // Exclude e2e tests which have their own configuration
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/e2e/'
  ],

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      // Disable type checking during tests for better performance
      isolatedModules: true,
    }],
  },

  // Module name mapper for TypeScript path aliases
  moduleNameMapper: {
    '^@austa/tracing/(.*)$': '<rootDir>/src/$1',
    '^@austa/tracing': '<rootDir>/src/index.ts',
    '^@austa/(.*)$': '<rootDir>/../$1/src',
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Coverage configuration
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/constants/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },

  // Test timeout settings for async tracing operations
  // OpenTelemetry operations may take longer than the default timeout
  testTimeout: 10000,

  // Display test results with proper formatting
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The maximum amount of workers used to run your tests
  // Setting to 1 helps prevent issues with OpenTelemetry's global state
  maxWorkers: 1,

  // Allows for custom reporters to be used
  reporters: ['default'],

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Indicates whether each individual test should be reported during the run
  silent: false,

  // The paths to modules that run some code to configure or set up the testing environment
  // OpenTelemetry requires special handling for its global state
  testEnvironmentOptions: {
    // Custom options for handling OpenTelemetry context propagation
    openTelemetryContextPropagation: true,
  },

  // A map from regular expressions to paths to transformers
  // This ensures proper handling of dependencies
  transformIgnorePatterns: [
    '/node_modules/(?!(@opentelemetry|@austa)/)',
  ],

  // Indicates whether the coverage information should be collected while executing the test
  // This is particularly important for tracing tests to ensure proper coverage of async code
  coverageProvider: 'v8',
};