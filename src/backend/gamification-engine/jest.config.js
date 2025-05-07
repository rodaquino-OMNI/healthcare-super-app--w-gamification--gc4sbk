/**
 * Jest configuration for the Gamification Engine service
 * 
 * This configuration enables comprehensive testing of the gamification functionality,
 * including unit, integration, and end-to-end tests. It sets up TypeScript processing,
 * path aliases for imports, coverage reporting, and environment variables.
 */

module.exports = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // File extensions Jest will look for
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Root directory for all tests
  rootDir: '.',
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Configure path aliases to match tsconfig.json
  moduleNameMapper: {
    '^@app/auth(|/.*)$': '<rootDir>/../auth-service/src$1',
    '^@app/shared(|/.*)$': '<rootDir>/../shared/src$1',
    '^@app/gamification(|/.*)$': '<rootDir>/src$1',
    '^@app/health(|/.*)$': '<rootDir>/../health-service/src$1',
    '^@app/care(|/.*)$': '<rootDir>/../care-service/src$1',
    '^@app/plan(|/.*)$': '<rootDir>/../plan-service/src$1',
    '^@app/notifications(|/.*)$': '<rootDir>/../notification-service/src$1',
  },
  
  // Default test pattern if no specific type is specified
  testRegex: '.*\\.spec\\.ts$',
  
  // Collect coverage from all TypeScript files
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.mock.ts',
    '!src/**/*.constant.ts',
    '!src/**/*.enum.ts',
  ],
  
  // Output directory for coverage reports
  coverageDirectory: './coverage',
  
  // Display individual test results
  verbose: true,
  
  // Set timeout for tests (in milliseconds)
  testTimeout: 30000,
  
  // Uncomment and create these files when needed
  // // Setup files to run before tests
  // setupFiles: ['<rootDir>/test/setup.ts'],
  // 
  // // Global setup and teardown
  // globalSetup: '<rootDir>/test/global-setup.ts',
  // globalTeardown: '<rootDir>/test/global-teardown.ts',
  
  // Projects configuration for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      testPathIgnorePatterns: [
        '\\.integration\\.spec\\.ts$',
        '\\.e2e-spec\\.ts$',
        '\\.perf\\.spec\\.ts$',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.spec.ts'],
      testTimeout: 60000,
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      testTimeout: 60000,
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/test/**/*.perf.spec.ts'],
      testTimeout: 120000,
    },
  ],
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  

  
  // Automatically restore mock state between every test
  restoreMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  

  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  
  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/achievements/': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/events/': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};