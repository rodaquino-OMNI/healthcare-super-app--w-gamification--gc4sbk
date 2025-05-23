import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the tsconfig to get the paths configuration
const tsConfigPath = resolve(__dirname, '../tsconfig.json');
const tsConfigContent = readFileSync(tsConfigPath, 'utf-8');
const tsConfig = JSON.parse(tsConfigContent);

const config: Config = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Root directory to scan for tests
  rootDir: '../',
  
  // Directories to scan for tests
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  
  // File extensions for test files
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Test file patterns
  testRegex: '.*\\.spec\\.ts$',
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Add additional mappings for monorepo packages
    '^@austa/interfaces(.*)$': '<rootDir>/../interfaces/src$1',
    '^@austa/errors(.*)$': '<rootDir>/../errors/src$1',
    '^@austa/events(.*)$': '<rootDir>/../events/src$1',
    '^@austa/logging(.*)$': '<rootDir>/../logging/src$1',
    '^@austa/tracing(.*)$': '<rootDir>/../tracing/src$1',
    '^@austa/database(.*)$': '<rootDir>/../database/src$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
  
  // Code coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    // Add specific thresholds for critical utility modules
    './src/array/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/validation/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: false,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Maximum number of concurrent tests
  maxConcurrency: 5,
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error on snapshot differences
  errorOnDeprecated: true,
  
  // Fail on missing snapshots
  bail: false,
  
  // Notification mode
  notify: false,
  
  // Projects configuration for monorepo
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      testPathIgnorePatterns: ['<rootDir>/src/**/*.e2e-spec.ts', '<rootDir>/src/**/*.integration-spec.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration-spec.ts'],
      testTimeout: 30000,
    },
  ],
  
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
};

export default config;