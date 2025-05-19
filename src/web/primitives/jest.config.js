/**
 * Jest configuration for @design-system/primitives package
 *
 * This configuration sets up the testing environment for the primitives package,
 * including proper handling of TypeScript, styled-components, and module resolution.
 */

module.exports = {
  // Use JSDOM as the test environment for browser-like testing
  testEnvironment: 'jsdom',
  
  // Setup files to run before each test
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    'jest-styled-components'
  ],
  
  // Transform files with TypeScript and Babel
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // File extensions to look for when importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@design-system/primitives/(.*)$': '<rootDir>/src/$1',
    '^@design-system/primitives$': '<rootDir>/src',
    '^@/tokens/(.*)$': '<rootDir>/src/tokens/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Prevents tests from printing messages through the console
  silent: false,
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  
  // An array of regexp pattern strings that are matched against all test paths before executing the test
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // An array of regexp pattern strings that are matched against all source file paths before re-running tests
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
};