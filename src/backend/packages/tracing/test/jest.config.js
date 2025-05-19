/**
 * Jest configuration for the @austa/tracing package tests.
 * 
 * This configuration ensures proper test execution for all tracing components,
 * handling OpenTelemetry's instrumentation in the test environment, and
 * providing appropriate settings for coverage reporting and module resolution.
 */

module.exports = {
  // Use Node.js as the test environment
  testEnvironment: 'node',
  
  // Root directory to scan for tests
  rootDir: '../',
  
  // Test file patterns to match
  testMatch: [
    '<rootDir>/test/unit/**/*.spec.ts',
    '<rootDir>/test/integration/**/*.integration.spec.ts',
  ],
  
  // Exclude e2e tests which have their own configuration
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/e2e/'
  ],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }],
  },
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@austa/tracing(.*)$': '<rootDir>/src$1',
    '^@austa/logging(.*)$': '<rootDir>/../logging/src$1',
    '^@austa/interfaces(.*)$': '<rootDir>/../interfaces/src$1',
    '^@austa/errors(.*)$': '<rootDir>/../errors/src$1',
  },
  
  // Setup and teardown files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  globalTeardown: '<rootDir>/test/teardown.ts',
  
  // Coverage configuration
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/tracing.service.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Timeout settings for async tracing operations
  // OpenTelemetry operations may take longer than default Jest timeout
  testTimeout: 10000,
  
  // Display test results with proper formatting
  verbose: true,
  
  // Clear mocks between tests to prevent state leakage
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  
  // Detect open handles to identify potential memory leaks
  // Important for tracing which may create background resources
  detectOpenHandles: true,
  
  // Force exit after tests complete to clean up any lingering processes
  // This is important for OpenTelemetry which may have background exporters
  forceExit: true,
  
  // Disable watchman for CI environments
  watchman: false,
  
  // Use a custom resolver to handle OpenTelemetry's instrumentation modules
  resolver: '<rootDir>/test/utils/resolver.js',
  
  // Additional globals for test environment
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        warnOnly: true,
      },
    },
    // Environment variables for testing
    __TEST__: true,
    // Disable actual telemetry export during tests
    OTEL_SDK_DISABLED: true,
  },
};