import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../tsconfig.json';

/**
 * Jest configuration for end-to-end testing of the auth package.
 * This configuration extends the base Jest configuration with settings
 * specific to E2E testing, including longer timeouts for API requests,
 * test database connections, and HTTP server setup.
 */
const config: Config.InitialOptions = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // File extensions Jest will look for
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Root directory for tests
  rootDir: '..',
  
  // Pattern to detect E2E test files
  testRegex: '.e2e-spec.ts$',
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Use longer timeout for E2E tests (30 seconds)
  testTimeout: 30000,
  
  // Map module paths from tsconfig
  moduleNameMapper: {
    // Map paths from tsconfig.json
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Map @austa namespace packages
    '^@austa/(.*)$': '<rootDir>/../../../$1',
    // Map journey-specific imports
    '^@app/(.*)$': '<rootDir>/../../$1',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  
  // Setup and teardown files
  globalSetup: '<rootDir>/test/setup-tests.ts',
  globalTeardown: '<rootDir>/test/global-teardown.js',
  
  // Display detailed test results
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Force using a new instance of Jest for each test file
  maxWorkers: '50%',
  
  // Use setup-tests.ts for environment setup as well
  // If a separate setup-env.ts is needed in the future, it can be added here
  
  // Disable type checking for faster test execution
  // Enable only when needed for debugging type issues
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
    },
  },
};

export default config;