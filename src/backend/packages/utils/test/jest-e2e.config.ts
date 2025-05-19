/**
 * Jest E2E Configuration for @austa/utils package
 *
 * This configuration extends the base Jest configuration with settings specific to
 * end-to-end testing of utility functions in real application contexts. It configures
 * longer timeouts for network operations, sets up proper module resolution, and includes
 * specialized test matchers for validating utility functions in complete workflows.
 */

import type { Config } from '@jest/types';
import { defaults } from 'jest-config';
import * as path from 'path';

// Import base configuration from root level
const baseConfig = require('../../jest.config');

/**
 * E2E-specific Jest configuration that extends the base configuration
 * with settings optimized for end-to-end testing of utility functions.
 */
const config: Config.InitialOptions = {
  ...baseConfig,
  // Specify the test pattern for E2E tests
  testMatch: ['**/*.e2e-spec.ts'],
  
  // Configure longer timeouts for network and integration tests
  testTimeout: 60000, // 60 seconds for E2E tests
  
  // Set up the test environment
  testEnvironment: 'node',
  
  // Include setup files for custom matchers and mocks
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
  
  // Configure module name mapping for proper import resolution
  moduleNameMapper: {
    '^@austa/utils/(.*)$': '<rootDir>/src/$1',
    '^@austa/utils$': '<rootDir>/index.ts',
    '^@austa/(.*)$': '<rootDir>/../$1/index.ts',
    '^@app/(.*)$': '<rootDir>/../../$1/src',
  },
  
  // Set up root directory for tests
  rootDir: path.resolve(__dirname, '..'),
  
  // Configure coverage collection for E2E tests
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/e2e',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/index.ts',
  ],
  
  // Configure coverage thresholds for E2E tests
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Configure globals for E2E tests
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/test/tsconfig.spec.json',
      isolatedModules: true,
    },
    // Set up test-specific environment variables
    __E2E_TEST__: true,
  },
  
  // Configure transform for TypeScript files
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/test/tsconfig.spec.json',
    }],
  },
  
  // Configure module file extensions
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'],
  
  // Configure verbose output for E2E tests
  verbose: true,
  
  // Configure maxWorkers for E2E tests
  maxWorkers: '50%',
  
  // Configure error handling for E2E tests
  bail: 1,
  
  // Configure test result processors
  testResultsProcessor: 'jest-sonar-reporter',
};

export default config;