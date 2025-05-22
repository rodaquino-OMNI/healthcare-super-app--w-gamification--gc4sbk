import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the root tsconfig.json to get the paths configuration
const rootTsConfig = JSON.parse(
  readFileSync(join(__dirname, '../../../tsconfig.json'), 'utf8')
);

/**
 * Jest configuration for the @austa/errors package tests
 * This configuration ensures consistent test execution across local development and CI environments
 * while maintaining compatibility with the monorepo structure.
 */
const config: Config.InitialOptions = {
  // Set the test environment to Node.js
  testEnvironment: 'node',
  
  // Use ts-jest for TypeScript files
  preset: 'ts-jest',
  
  // Define the root directory for tests
  rootDir: '..',
  
  // Define test file patterns
  testRegex: '.*\\.spec\\.ts$',
  
  // Define file extensions to be processed by Jest
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Configure module name mapping to resolve path aliases
  moduleNameMapper: {
    // Use the paths from the root tsconfig.json for consistent module resolution
    ...pathsToModuleNameMapper(rootTsConfig.compilerOptions.paths, {
      prefix: '<rootDir>/../..'
    }),
    // Add specific mappings for the errors package
    '^@austa/errors/(.*)$': '<rootDir>/src/$1',
    '^@austa/errors$': '<rootDir>/src'
  },
  
  // Configure TypeScript transformation
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }]
  },
  
  // Configure coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/index.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  
  // Set coverage thresholds to ensure adequate test coverage
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Set specific thresholds for critical components
    './src/categories/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/journey/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Configure test timeout
  testTimeout: 10000,
  
  // Configure verbose output for better debugging
  verbose: true,
  
  // Configure test result caching for faster re-runs
  cache: true,
  
  // Configure global setup and teardown
  globalSetup: '<rootDir>/test/helpers/globalSetup.ts',
  globalTeardown: '<rootDir>/test/helpers/globalTeardown.ts',
  
  // Configure test setup files
  setupFilesAfterEnv: ['<rootDir>/test/helpers/setupTests.ts'],
  
  // Configure test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Configure test result processors
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Configure test paths to include
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  
  // Configure test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
};

export default config;