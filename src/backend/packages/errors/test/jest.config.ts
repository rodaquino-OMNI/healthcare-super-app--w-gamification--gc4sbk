import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

// Resolve the root directory of the package
const packageRoot = resolve(__dirname, '..');
// Resolve the root directory of the monorepo
const monorepoRoot = resolve(packageRoot, '..', '..', '..');

// Read the tsconfig to get the paths mapping
const tsconfig = JSON.parse(
  readFileSync(join(packageRoot, 'tsconfig.json')).toString()
);

// Read the root tsconfig for additional path mappings
let rootTsConfig;
try {
  rootTsConfig = JSON.parse(
    readFileSync(join(monorepoRoot, 'tsconfig.json')).toString()
  );
} catch (e) {
  // If root tsconfig doesn't exist, use an empty object
  rootTsConfig = { compilerOptions: { paths: {} } };
}

/**
 * Jest configuration for unit and integration tests of the error handling package.
 * This configuration ensures consistent test execution across local development and CI environments
 * while maintaining compatibility with the monorepo structure.
 */
const config: Config.InitialOptions = {
  // Set the test environment to Node.js
  testEnvironment: 'node',
  
  // Root directory for tests
  rootDir: '../',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/unit/**/*.spec.ts',
    '<rootDir>/test/integration/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],
  
  // Group tests by file path pattern
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/test/e2e/',
  ],
  
  // Display test results with descriptive formatter
  testResultsProcessor: 'jest-sonar-reporter',
  
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  
  // Collect coverage information
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/*.constants.ts',
    '!<rootDir>/src/**/main.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    // Journey-specific error handling requires higher coverage
    './src/journey/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    // Categories of errors need thorough testing
    './src/categories/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    // Decorators and middleware need thorough testing
    './src/(decorators|middleware)/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  
  // Generate coverage reports in multiple formats for CI integration
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  
  
  // Module resolution configuration
  moduleNameMapper: {
    // Map paths from package tsconfig for proper module resolution
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Map paths from root tsconfig for monorepo-wide resolution
    ...pathsToModuleNameMapper(rootTsConfig.compilerOptions.paths || {}, {
      prefix: join(monorepoRoot, '/'),
    }),
    // Ensure @austa/* packages are properly resolved
    '^@austa/(.*)$': join(monorepoRoot, 'src/backend/packages/$1/src'),
    // Map journey-specific imports
    '^@app/journey/(.*)$': '<rootDir>/src/journey/$1',
    // Map internal package imports
    '^@app/errors/(.*)$': '<rootDir>/src/$1',
  },
  
  // Resolver configuration for monorepo structure
  resolver: '<rootDir>/test/jest-resolver.js',
  
  
  // Directories to search for test files
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  
  
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Global setup/teardown
  globalSetup: '<rootDir>/test/global-setup.js',
  globalTeardown: '<rootDir>/test/global-teardown.js',
  
  // Projects configuration for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts', '<rootDir>/src/**/*.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/test/integration/', '/test/e2e/'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/test/unit/', '/test/e2e/'],
    },
  ],
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
};

export default config;