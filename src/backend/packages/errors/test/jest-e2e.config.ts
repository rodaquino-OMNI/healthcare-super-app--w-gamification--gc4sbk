import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import baseConfig from './jest.config';

// Read the TypeScript configuration
const { compilerOptions } = require('../tsconfig.json');

/**
 * Jest configuration for end-to-end testing of the error handling framework.
 * Extends the base Jest configuration with E2E-specific settings.
 * 
 * This configuration is designed for testing error handling components in a real
 * NestJS application context, including exception filters, interceptors, and
 * error handling in a complete HTTP request/response cycle.
 */
const config: Config.InitialOptions = {
  ...baseConfig,
  // Identify this as an E2E test configuration
  displayName: 'errors:e2e',
  
  // Use a different test environment for E2E tests
  testEnvironment: 'node',
  
  // Only run files in the e2e directory with the e2e-spec.ts suffix
  testRegex: '\.e2e-spec\.ts$',
  rootDir: '../',
  
  // Configure longer timeouts for E2E tests with HTTP requests
  testTimeout: 30000,
  
  // Set up module name mapping for the E2E test environment
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    '^@austa/errors/(.*)$': '<rootDir>/src/$1',
    '^@austa/errors$': '<rootDir>/src',
    '^@austa/(.*)$': '<rootDir>/../$1/src',
  },
  
  // Configure coverage collection for E2E tests
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/index.ts',
  ],
  
  // Set up global setup and teardown for E2E tests
  globalSetup: '<rootDir>/test/e2e/setup-e2e.ts',
  globalTeardown: '<rootDir>/test/e2e/teardown-e2e.ts',
  
  // Use a different setup file for E2E tests
  setupFilesAfterEnv: ['<rootDir>/test/setup-e2e-tests.ts'],
  
  // Configure transform for TypeScript files
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/test/tsconfig.spec.json',
      isolatedModules: true,
    }],
  },
  
  // Configure module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Configure test results processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Configure verbose output for better debugging
  verbose: true,
};

export default config;