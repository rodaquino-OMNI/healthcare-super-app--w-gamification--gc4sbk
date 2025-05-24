/**
 * Jest configuration for the AUSTA SuperApp journey-context package
 * 
 * This configuration supports comprehensive testing for the journey context providers
 * that facilitate state management across all three user journeys:
 * - My Health (Minha Saúde)
 * - Care Now (Cuidar-me Agora)
 * - My Plan & Benefits (Meu Plano & Benefícios)
 * 
 * The configuration ensures proper testing of cross-platform functionality
 * for both web and mobile implementations.
 */

module.exports = {
  // Use jsdom environment for browser-like DOM testing
  testEnvironment: 'jest-environment-jsdom',
  
  // Transform files using babel-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
  },
  
  // Don't transform node_modules except for our internal packages
  transformIgnorePatterns: [
    '/node_modules/(?!(@austa/design-system|@design-system/primitives|@austa/interfaces))',
  ],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    // Package path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@storage/(.*)$': '<rootDir>/src/storage/$1',
    
    // Handle CSS and image imports in tests
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Supported file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__mocks__/**',
  ],
  
  // Coverage thresholds for different parts of the package
  coverageThreshold: {
    // Global threshold requirements
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    // Journey-specific coverage thresholds
    './src/providers/health/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/providers/care/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/providers/plan/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    // Adapters have higher coverage requirements due to platform-specific code
    './src/adapters/': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
  
  // Pattern for finding test files
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{spec,test}.{js,jsx,ts,tsx}'],
  
  // Enable verbose output
  verbose: true,
  
  // Setup files to run after the test environment is set up
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  
  // Limit the number of workers to 50% of available cores
  maxWorkers: '50%',
};