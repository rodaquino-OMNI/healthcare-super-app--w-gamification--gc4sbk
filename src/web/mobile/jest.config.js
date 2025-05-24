/**
 * Jest configuration for the AUSTA SuperApp mobile application
 * This config enables comprehensive testing across all three user journeys
 * with support for the new design system packages and module resolution
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use React Native preset for Jest
  preset: 'react-native',

  // Setup files to run after the test environment is set up
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.js'
  ],

  // Transform files using babel-jest with enhanced TypeScript support
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }]
  },

  // Don't transform modules in node_modules except for React Native related packages and our design system packages
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|@austa/design-system|@design-system/primitives|@austa/interfaces|@austa/journey-context)/)'
  ],

  // Module path aliases to match webpack and tsconfig path aliases
  moduleNameMapper: {
    // App-specific path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    
    // Design system packages path aliases
    '^@austa/design-system$': '<rootDir>/../design-system/src/index',
    '^@austa/design-system/(.*)$': '<rootDir>/../design-system/src/$1',
    '^@design-system/primitives$': '<rootDir>/../primitives/src/index',
    '^@design-system/primitives/(.*)$': '<rootDir>/../primitives/src/$1',
    '^@austa/interfaces$': '<rootDir>/../interfaces/index',
    '^@austa/interfaces/(.*)$': '<rootDir>/../interfaces/$1',
    '^@austa/journey-context$': '<rootDir>/../journey-context/src/index',
    '^@austa/journey-context/(.*)$': '<rootDir>/../journey-context/src/$1',
    
    // Asset mocks
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // Directories to search for modules
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/../design-system/src',
    '<rootDir>/../primitives/src',
    '<rootDir>/../interfaces',
    '<rootDir>/../journey-context/src'
  ],

  // File extensions to consider when resolving modules - prioritize TypeScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Patterns to match for test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Patterns to ignore when searching for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/e2e/'
  ],

  // Test environment - using jsdom for React Native component testing
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['react-native']
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/assets/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!**/node_modules/**'
  ],

  // Coverage thresholds to enforce
  coverageThreshold: {
    // Global thresholds
    'global': {
      'statements': 75,
      'branches': 75,
      'functions': 75,
      'lines': 75
    },
    // Journey-specific thresholds with higher requirements for UI components
    './src/components/': {
      'statements': 85,
      'branches': 85,
      'functions': 85,
      'lines': 85
    },
    // Health journey coverage requirements
    './src/screens/health/': {
      'statements': 80,
      'branches': 80,
      'functions': 80,
      'lines': 80
    },
    // Care journey coverage requirements
    './src/screens/care/': {
      'statements': 80,
      'branches': 80,
      'functions': 80,
      'lines': 80
    },
    // Plan journey coverage requirements
    './src/screens/plan/': {
      'statements': 80,
      'branches': 80,
      'functions': 80,
      'lines': 80
    }
  },

  // Mock all imported modules in ./node_modules that match this pattern
  watchPathIgnorePatterns: [
    'node_modules'
  ],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover'
  ]
};