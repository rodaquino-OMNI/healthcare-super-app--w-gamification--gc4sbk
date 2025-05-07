/**
 * Jest configuration for the AUSTA SuperApp backend
 * This configuration enables consistent testing across all backend services
 * with proper module resolution, coverage reporting, and test discovery.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.test.ts',
    '**/*.spec.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/test/fixtures/**',
    '!**/test/mocks/**',
    '!**/test/helpers/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Journey-specific coverage thresholds
    'src/health/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/care/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/plan/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    // Core packages
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@app/shared/(.*)$': '<rootDir>/../shared/src/$1',
    
    // New package structure
    '^@austa/interfaces/(.*)$': '<rootDir>/../packages/interfaces/$1',
    '^@austa/database/(.*)$': '<rootDir>/../packages/database/$1',
    '^@austa/errors/(.*)$': '<rootDir>/../packages/errors/src/$1',
    '^@austa/events/(.*)$': '<rootDir>/../packages/events/src/$1',
    '^@austa/logging/(.*)$': '<rootDir>/../packages/logging/src/$1',
    '^@austa/tracing/(.*)$': '<rootDir>/../packages/tracing/src/$1',
    '^@austa/utils/(.*)$': '<rootDir>/../packages/utils/src/$1',
    '^@austa/auth/(.*)$': '<rootDir>/../packages/auth/src/$1',
    
    // Journey services
    '^@auth/(.*)$': '<rootDir>/../auth-service/src/$1',
    '^@app/auth/(.*)$': '<rootDir>/../auth-service/src/$1',
    '^@health/(.*)$': '<rootDir>/../health-service/src/$1',
    '^@app/health/(.*)$': '<rootDir>/../health-service/src/$1',
    '^@care/(.*)$': '<rootDir>/../care-service/src/$1',
    '^@app/care/(.*)$': '<rootDir>/../care-service/src/$1',
    '^@plan/(.*)$': '<rootDir>/../plan-service/src/$1',
    '^@app/plan/(.*)$': '<rootDir>/../plan-service/src/$1',
    
    // Other services
    '^@gamification/(.*)$': '<rootDir>/../gamification-engine/src/$1',
    '^@app/gamification/(.*)$': '<rootDir>/../gamification-engine/src/$1',
    '^@notification/(.*)$': '<rootDir>/../notification-service/src/$1',
    '^@app/notification/(.*)$': '<rootDir>/../notification-service/src/$1',
    '^@api-gateway/(.*)$': '<rootDir>/../api-gateway/src/$1',
    '^@app/api-gateway/(.*)$': '<rootDir>/../api-gateway/src/$1'
  },
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(@austa|@app|@shared)/)'
  ],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: '50%',
  
  // Journey-specific test configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/**/*.unit.spec.ts', '**/*.unit.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/']
    },
    {
      displayName: 'integration',
      testMatch: ['**/__tests__/**/*.integration.spec.ts', '**/*.integration.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/']
    },
    {
      displayName: 'e2e',
      testMatch: ['**/__tests__/**/*.e2e.spec.ts', '**/*.e2e.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/']
    }
  ]