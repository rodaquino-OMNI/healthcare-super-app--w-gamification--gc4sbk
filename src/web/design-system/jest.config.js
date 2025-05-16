/**
 * Jest configuration for the @austa/design-system package
 * 
 * This configuration supports comprehensive testing of all design system components
 * across all three user journeys (Health, Care, Plan) and ensures proper integration
 * with the primitives, interfaces, and journey-context packages.
 */

module.exports = {
  // Use jsdom for testing React components
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files to run after the test environment is set up
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
    '<rootDir>/src/test/setup.ts'
  ],
  
  // Transform files using babel-jest
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
    // Transform styled-components
    '^.+\\.styles\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  
  // Don't transform modules in node_modules except for our internal packages
  transformIgnorePatterns: [
    '/node_modules/(?!(@design-system/primitives|@austa/interfaces|@austa/journey-context)/)',
  ],
  
  // Module path aliases to match webpack and tsconfig path aliases
  moduleNameMapper: {
    // Internal path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@themes/(.*)$': '<rootDir>/src/themes/$1',
    '^@health/(.*)$': '<rootDir>/src/health/$1',
    '^@care/(.*)$': '<rootDir>/src/care/$1',
    '^@plan/(.*)$': '<rootDir>/src/plan/$1',
    '^@gamification/(.*)$': '<rootDir>/src/gamification/$1',
    '^@charts/(.*)$': '<rootDir>/src/charts/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1',
    
    // Handle CSS and image imports in tests
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/mocks/fileMock.js',
  },
  
  // File extensions to consider when resolving modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore when searching for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.storybook/'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/test/**',
    '!src/**/*.mock.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}'
  ],
  
  // Coverage thresholds to enforce
  coverageThreshold: {
    // Global thresholds
    'global': {
      'statements': 80,
      'branches': 80,
      'functions': 80,
      'lines': 80
    },
    // Core components have higher requirements
    './src/components/': {
      'statements': 90,
      'branches': 85,
      'functions': 90,
      'lines': 90
    },
    // Journey-specific components
    './src/health/': {
      'statements': 85,
      'branches': 80,
      'functions': 85,
      'lines': 85
    },
    './src/care/': {
      'statements': 85,
      'branches': 80,
      'functions': 85,
      'lines': 85
    },
    './src/plan/': {
      'statements': 85,
      'branches': 80,
      'functions': 85,
      'lines': 85
    },
    // Gamification components
    './src/gamification/': {
      'statements': 85,
      'branches': 80,
      'functions': 85,
      'lines': 85
    },
    // Chart components
    './src/charts/': {
      'statements': 85,
      'branches': 80,
      'functions': 85,
      'lines': 85
    }
  },
  
  // Pattern for finding test files
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{spec,test}.{js,jsx,ts,tsx}'],
  
  // Enable verbose output
  verbose: true,
  
  // Limit the number of workers to 50% of available cores for better performance
  maxWorkers: '50%',
  
  // Watch plugins for better developer experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Global variables available in all test files
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true
    }
  },
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  
  // The root directory that Jest should scan for tests and modules within
  rootDir: './',
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],
  
  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: "jest-runner",
  
  // The paths to modules that run some code to configure or set up the testing environment
  // setupFiles: [],
  
  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: ['@emotion/jest/serializer']
};