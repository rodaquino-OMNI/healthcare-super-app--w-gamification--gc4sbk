/**
 * Jest configuration for the @austa/journey-context package
 * 
 * This configuration supports comprehensive testing for the journey context package
 * which provides shared context functionality across all three user journeys:
 * - My Health (Minha Saúde)
 * - Care Now (Cuidar-me Agora)
 * - My Plan & Benefits (Meu Plano & Benefícios)
 * 
 * The configuration is designed to work with both web and mobile platforms,
 * ensuring consistent behavior across the entire AUSTA SuperApp ecosystem.
 */

module.exports = {
  // Use jsdom environment for browser-like DOM testing
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files that run after the testing environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transform files using babel-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Don't transform node_modules except for our internal packages
  transformIgnorePatterns: [
    '/node_modules/(?!(@austa/design-system|@austa/primitives|@austa/interfaces))',
  ],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    // Package path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@storage/(.*)$': '<rootDir>/src/storage/$1',
    
    // Handle CSS and image imports in tests
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    
    // Mock implementations for platform-specific modules
    // This allows testing code that uses React Native modules in a jsdom environment
    '^react-native$': 'react-native-web',
    '@react-native-async-storage/async-storage': '<rootDir>/__mocks__/asyncStorageMock.js',
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
    '!src/index.ts',
  ],
  
  // Coverage thresholds for different parts of the package
  coverageThreshold: {
    // Global threshold requirements
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    // Provider components have higher coverage requirements
    './src/providers/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    // Journey-specific adapters need thorough testing
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
  
  // Limit the number of workers to 50% of available cores
  maxWorkers: '50%',
};