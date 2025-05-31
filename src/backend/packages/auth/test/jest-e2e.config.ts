/**
 * Jest configuration for end-to-end testing of the auth package
 * 
 * This configuration extends the base Jest configuration with settings
 * specific to end-to-end testing, including longer timeouts for API requests,
 * test database connections, and HTTP server setup.
 */

import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read tsconfig to use its paths for module name mapping
const tsconfig = JSON.parse(
  readFileSync(join(__dirname, 'tsconfig.spec.json'), 'utf-8')
);

/**
 * Jest configuration for end-to-end tests
 * Extends the base configuration with E2E-specific settings
 */
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: [
    '<rootDir>/test/e2e/**/*.e2e-spec.ts',
    '<rootDir>/test/integration/**/*.integration-spec.ts'
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/*.dto.ts',
    '!<rootDir>/src/**/*.entity.ts',
    '!<rootDir>/src/**/*.constants.ts',
    '!<rootDir>/src/**/*.types.ts',
    '!<rootDir>/src/**/main.ts',
    '!<rootDir>/dist/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: '<rootDir>/coverage/e2e',
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: '<rootDir>/../..'
  }),
  // Longer timeouts for E2E tests that involve real HTTP requests and database operations
  testTimeout: 60000,
  // Setup files for the E2E test environment
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
  // Global teardown script to clean up resources after all tests
  globalTeardown: '<rootDir>/test/global-teardown.js',
  // Verbose output for better debugging of E2E tests
  verbose: true,
  // Limit parallel execution for E2E tests to avoid resource contention
  maxWorkers: 4,
  // Additional globals for E2E testing
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/test/tsconfig.spec.json',
      isolatedModules: true
    },
    // Environment variables for E2E tests
    __E2E_TEST__: true
  },
  // Specific transformIgnorePatterns for E2E tests
  transformIgnorePatterns: [
    '/node_modules/(?!(@austa|@nestjs)/)'
  ],
  // Additional options for E2E testing
  bail: true, // Stop running tests after the first failure
  forceExit: true, // Force Jest to exit after all tests complete
  detectOpenHandles: true, // Detect open handles (like database connections) that weren't closed
  // Custom reporters for E2E test results
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/reports',
      outputName: 'e2e-junit.xml'
    }]
  ]
};

export default config;