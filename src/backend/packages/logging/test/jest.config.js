/**
 * Jest configuration for the logging package tests.
 * This configuration ensures consistent test execution across all test types
 * (unit, integration, e2e) and enables proper TypeScript configuration with path mappings.
 */
module.exports = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Specify which file extensions Jest should look for
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // The root directory where Jest should scan for tests
  rootDir: '.',
  
  // The pattern to detect test files
  testRegex: '.*\.spec\.ts$',
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  
  // Default timeout for tests (5 seconds)
  testTimeout: 5000,
  
  // Setup files to run before tests
  // Uncomment and create this file if needed for test setup
  // setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  
  // Verbose output to help with debugging
  verbose: true,
  
  // Collect coverage information
  collectCoverage: true,
  
  // When enabled, coverage will only be collected from files matching the specified glob pattern
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.ts',
    '!<rootDir>/../src/**/*.spec.ts',
    '!<rootDir>/../src/**/*.e2e-spec.ts',
    '!<rootDir>/../src/**/*.mock.ts',
    '!<rootDir>/../src/**/*.module.ts',
    '!<rootDir>/../src/**/*.interface.ts',
    '!<rootDir>/../src/**/index.ts',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage',
  
  // Coverage thresholds to enforce code quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether each individual test should be reported during the run
  reporters: ['default', 'jest-junit'],
  
  // Configure Jest JUnit reporter for CI integration
  reporterOptions: {
    junitReporter: {
      outputDirectory: '<rootDir>/../reports/junit',
      outputName: 'test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
    },
  },
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@app/logging/(.*)$': '<rootDir>/../src/$1',
    '^@app/shared/(.*)$': '<rootDir>/../../shared/src/$1',
    '^@austa/(.*)$': '<rootDir>/../../$1/src',
    '^@austa/interfaces/(.*)$': '<rootDir>/../../../web/interfaces/$1',
  },
  
  // Global variables available in all test files
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json',
      isolatedModules: true,
    },
  },
  
  // Automatically restore mocks between tests
  restoreMocks: true,
  
  // Run tests in a single process rather than creating a worker pool
  // This can be helpful for debugging
  // runInBand: true,
  
  // Force exit after all tests complete
  forceExit: true,
  
  // Directory for test results
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Different test patterns for specific test types
  // Can be used with Jest's --testRegex CLI option to run specific test suites
  testPatterns: {
    unit: '.*\.spec\.ts$',
    integration: '.*\.integration-spec\.ts$',
    e2e: '.*\.e2e-spec\.ts$'
  },
};