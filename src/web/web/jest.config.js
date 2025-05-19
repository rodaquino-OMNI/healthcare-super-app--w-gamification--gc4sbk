/**
 * Jest configuration for AUSTA SuperApp web application
 * 
 * This configuration supports comprehensive testing for all three user journeys:
 * - My Health (Minha Saúde)
 * - Care Now (Cuidar-me Agora)
 * - My Plan & Benefits (Meu Plano & Benefícios)
 * 
 * The configuration aligns with the project's quality metrics requirements,
 * implementing journey-specific test coverage thresholds.
 */

module.exports = {
  // Use jsdom environment for browser-like DOM testing
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files that run after the testing environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transform files using babel-jest with Next.js babel preset
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Don't transform node_modules except for our internal packages
  transformIgnorePatterns: [
    '/node_modules/(?!(@austa/design-system|@austa/shared|@design-system/primitives|@austa/interfaces|@austa/journey-context))',
  ],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    // Application path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@layouts/(.*)$': '<rootDir>/src/layouts/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    
    // Handle CSS and image imports in tests
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Supported file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  
  // Coverage thresholds for different parts of the application
  coverageThreshold: {
    // Global threshold requirements
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    // UI components have higher coverage requirements
    './src/components/': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
    // Journey-specific coverage thresholds
    './src/pages/health/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/pages/care/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/pages/plan/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  
  // Pattern for finding test files
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{spec,test}.{js,jsx,ts,tsx}'],
  
  // Enable verbose output
  verbose: true,
  
  // Limit the number of workers to 50% of available cores
  maxWorkers: '50%',
};