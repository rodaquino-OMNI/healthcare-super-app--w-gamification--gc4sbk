import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the tsconfig to get the paths configuration
const tsconfig = JSON.parse(
  readFileSync(join(__dirname, '..', 'tsconfig.json'), 'utf-8')
);

const config: Config.InitialOptions = {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  rootDir: '../',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  // Directories to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/e2e/'
  ],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }]
  },
  
  // Module name mapping to resolve imports
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/'
    }),
    '^@austa/(.*)$': '<rootDir>/../$1/src'
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup-tests.ts'
  ],
  
  // Code coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.types.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Display test results with proper formatting
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Maximum number of concurrent tests
  maxConcurrency: 5,
  
  // Timeout for tests
  testTimeout: 10000,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Error handling
  bail: 0,
  errorOnDeprecated: true,
  
  // Notification configuration
  notify: false,
  
  // Global variables available in tests
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/tsconfig.json'
    }
  }
};

export default config;