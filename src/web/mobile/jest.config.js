/**
 * Jest configuration for the AUSTA SuperApp mobile application
 * This config enables comprehensive testing across all three user journeys
 * with support for the new design system architecture
 */

module.exports = {
  // Use React Native preset for Jest
  preset: 'react-native',

  // Setup files to run after the test environment is set up
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.js' // Added for design system initialization
  ],

  // Transform files using babel-jest with enhanced TypeScript support
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }]
  },

  // Don't transform modules in node_modules except for React Native related packages and our design system packages
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|@austa/design-system|@design-system/primitives|@austa/interfaces|@austa/journey-context)/)'
  ],

  // Module directories to search when resolving modules
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/../', // Access to other workspace packages
    '<rootDir>/../../node_modules' // Access to root node_modules
  ],

  // Module path aliases to match webpack and tsconfig path aliases
  moduleNameMapper: {
    // Internal path aliases
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
    
    // New design system package mappings
    '^@austa/design-system(.*)$': '<rootDir>/../design-system/src$1',
    '^@design-system/primitives(.*)$': '<rootDir>/../primitives/src$1',
    '^@austa/interfaces(.*)$': '<rootDir>/../interfaces$1',
    '^@austa/journey-context(.*)$': '<rootDir>/../journey-context/src$1',
    
    // Mock specific components that might cause issues in tests
    // '^@austa/design-system/components/SomeComponent$': '<rootDir>/__mocks__/SomeComponentMock.js',
    
    // Asset mocks
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // File extensions to consider when resolving modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Patterns to ignore when searching for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/e2e/',
    '/.yarn/'
  ],

  // Test match patterns for better organization
  testMatch: [
    '**/__tests__/**/*.spec.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Test environment
  testEnvironment: 'node',

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/assets/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    // Include imported components from design system packages
    '!**/node_modules/**',
    '!**/vendor/**'
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

  // Additional Jest configuration for design system testing
  // Comment explaining the purpose of this configuration
  haste: {
    enableSymlinks: true // Enable symlinks for monorepo package resolution
  },

  // Resolver options for better module resolution
  resolver: {
    resolverMainFields: ['react-native', 'browser', 'main']
  },

  // Cache configuration for faster tests
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};