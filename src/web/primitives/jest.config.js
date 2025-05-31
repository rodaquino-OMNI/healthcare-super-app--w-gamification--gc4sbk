/**
 * Jest configuration for @design-system/primitives package
 *
 * This configuration sets up the testing environment with JSDOM,
 * transforms for TypeScript and styled-components, module name mappings,
 * and coverage reporting for the primitives package.
 */

module.exports = {
  // Test environment setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', 'jest-styled-components'],
  
  // File patterns to test
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Transform files
  transform: {
    '^.+\.(ts|tsx)$': ['babel-jest', {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript'
      ],
      plugins: [
        'babel-plugin-styled-components',
        '@babel/plugin-transform-runtime'
      ]
    }]
  },
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@design-system/primitives/(.*)$': '<rootDir>/src/$1',
    '^@design-system/primitives$': '<rootDir>/src',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Other configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  
  // Handle non-JS files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Watch plugin configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Display test results with proper formatting
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './coverage/junit',
      outputName: 'jest-junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: 'true'
    }]
  ],
  
  // Cache configuration
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Prevent tests from timing out too quickly
  testTimeout: 10000
};