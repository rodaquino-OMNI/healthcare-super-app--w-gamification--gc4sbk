/**
 * Jest configuration for end-to-end tests of the database package.
 * This configuration is specifically designed for tests that interact with a real database.
 */
module.exports = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Specify which file extensions Jest should look for
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // The root directory where Jest should scan for tests
  rootDir: '.',
  
  // The pattern to detect test files
  testRegex: '\.e2e-spec\.ts$',
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Longer timeout for database operations (15 seconds)
  testTimeout: 15000,
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  
  // Retry failed tests to handle flaky database connections
  // This is especially important for tests that depend on database availability
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
    '!<rootDir>/../src/**/*.entity.ts',
    '!<rootDir>/../src/**/*.interface.ts',
    '!<rootDir>/../src/**/index.ts',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage',
  
  // Run tests in a single process rather than creating a worker pool
  // This is important for database tests to prevent connection conflicts
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
  
  // Global variables available in all test files
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json',
      isolatedModules: true,
    },
    // Database-specific configuration for tests
    // These can be overridden in individual test files if needed
    __DATABASE__: {
      // Use a dedicated test database to prevent affecting development data
      useTestDatabase: true,
      // Clean up database after tests
      cleanupAfterEach: true,
      // Maximum connection pool size for tests
      maxPoolSize: 5,
      // Connection timeout in milliseconds
      connectionTimeout: 10000,
      // Query timeout in milliseconds
      queryTimeout: 5000,
    },
  },
  
  // Automatically restore mocks between tests
  restoreMocks: true,
  
  // Maximum number of workers to use for running tests
  // For database tests, limiting this can prevent connection pool exhaustion
  maxWorkers: 1,
  
  // Force exit after all tests complete
  // This ensures that any hanging database connections are terminated
  forceExit: true,
};