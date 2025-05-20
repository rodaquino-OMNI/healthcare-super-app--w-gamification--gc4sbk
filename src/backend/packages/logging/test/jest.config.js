/**
 * Jest configuration for the logging package tests.
 * This configuration ensures consistent test execution across all test types (unit, integration, e2e)
 * and enables proper TypeScript configuration with path mappings.
 */

module.exports = {
  // Specify the root directory for tests
  roots: ['<rootDir>/../'],

  // Specify the directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage',

  // Collect coverage from these directories
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.ts',
    '!<rootDir>/../src/**/*.d.ts',
    '!<rootDir>/../src/**/*.interface.ts',
    '!<rootDir>/../src/**/index.ts',
    '!<rootDir>/../src/**/*.mock.ts',
    '!<rootDir>/../src/**/*.module.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Files to transform
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],

  // Global teardown
  globalTeardown: '<rootDir>/teardown.ts',

  // Test timeout
  testTimeout: 30000,

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@austa/logging/(.*)$': '<rootDir>/../src/$1',
    '^@austa/shared/(.*)$': '<rootDir>/../../shared/src/$1',
    '^@austa/tracing/(.*)$': '<rootDir>/../../tracing/src/$1',
    '^@austa/errors/(.*)$': '<rootDir>/../../errors/src/$1',
    '^@austa/utils/(.*)$': '<rootDir>/../../utils/src/$1',
    '^@austa/(.*)$': '<rootDir>/../../../$1',
  },

  // Display individual test results
  displayIndividualResults: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The paths to modules that run some code to configure or set up the testing environment
  // before each test
  setupFiles: [],

  // An array of regexp pattern strings that are matched against all test paths, matched tests
  // are skipped
  testPathIgnorePatterns: ['/node_modules/'],

  // This option sets the URL for the jsdom environment. It is reflected in properties such as
  // location.href
  testURL: 'http://localhost',

  // An array of regexp pattern strings that are matched against all source file paths, matched
  // files will skip transformation
  transformIgnorePatterns: ['/node_modules/'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/unit/**/*.spec.ts',
    '<rootDir>/integration/**/*.integration.spec.ts',
    '<rootDir>/e2e/**/*.e2e-spec.ts',
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Projects configuration for monorepo
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/unit/**/*.spec.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/integration/**/*.integration.spec.ts'],
      testEnvironment: 'node',
      testTimeout: 60000,
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/e2e/**/*.e2e-spec.ts'],
      testEnvironment: 'node',
      testTimeout: 120000,
    },
  ],
};