import type { Config } from '@jest/types'; // v29.7.0

// Jest configuration for the AUSTA SuperApp web application
const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Use jsdom as the test environment to simulate browser environment
  testEnvironment: 'jsdom',
  
  // Setup files to run after the environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Test factories for journey-specific entities
  setupFiles: ['<rootDir>/src/test/setup-journey-factories.ts'],
  
  // Module name mappings for import aliasing
  moduleNameMapper: {
    // Map imports starting with @/ to files in the src directory
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map imports starting with @shared/ to files in the shared directory
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    // Map imports for new packages
    '^@design-system/primitives(.*)$': '<rootDir>/../primitives/src$1',
    '^@austa/interfaces(.*)$': '<rootDir>/../interfaces$1',
    '^@austa/journey-context(.*)$': '<rootDir>/../journey-context/src$1',
    '^@austa/design-system(.*)$': '<rootDir>/../design-system/src$1',
    // Mock static assets like images and stylesheets
    '^.+\\.(svg|css|less|sass|scss|png|jpg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: ['next/babel'],
    }],
  },
  
  // Collect coverage information
  collectCoverage: true,
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '../primitives/src/**/*.{ts,tsx}',
    '../interfaces/**/*.{ts,tsx}',
    '../journey-context/src/**/*.{ts,tsx}',
    '../design-system/src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**/*.{ts,tsx}',
    '!src/test/**/*.{ts,tsx}',
    '!src/types/**/*.{ts,tsx}',
    '!src/i18n/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.stories.{ts,tsx}',
    '!**/__tests__/fixtures/**',
    '!**/__mocks__/**',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Journey-specific coverage thresholds with higher requirements
    './src/health/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/care/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/plan/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // New packages coverage thresholds
    '../primitives/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    '../interfaces/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    '../journey-context/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Module resolution paths
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  
  // Root directory
  rootDir: '../',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/../primitives/src/**/*.{spec,test}.{ts,tsx}',
    '<rootDir>/../interfaces/**/*.{spec,test}.{ts,tsx}',
    '<rootDir>/../journey-context/src/**/*.{spec,test}.{ts,tsx}',
    '<rootDir>/../design-system/src/**/*.{spec,test}.{ts,tsx}',
  ],
  
  // Patterns to ignore when transforming
  transformIgnorePatterns: [
    '/node_modules/(?!(@austa|@design-system)/)',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Results processor for integration with SonarQube
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Setup for journey-specific testing
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    },
    __JOURNEY_TESTING__: true,
  },
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
};

export default config;