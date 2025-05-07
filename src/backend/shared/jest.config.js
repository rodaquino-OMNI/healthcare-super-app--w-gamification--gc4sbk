/**
 * Jest configuration for the AUSTA SuperApp shared module
 * This configuration enables comprehensive testing of shared utilities
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
    'src/**/*.ts',
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
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    // Shared module path aliases
    '^@app/shared$': '<rootDir>/src',
    '^@app/shared/(.*)$': '<rootDir>/src/$1',
    
    // Package references
    '^@austa/(.*)$': '<rootDir>/../packages/$1',
    
    // Other service references for cross-service testing
    '^@auth/(.*)$': '<rootDir>/../auth-service/src/$1',
    '^@app/auth/(.*)$': '<rootDir>/../auth-service/src/$1',
    '^@health/(.*)$': '<rootDir>/../health-service/src/$1',
    '^@app/health/(.*)$': '<rootDir>/../health-service/src/$1',
    '^@care/(.*)$': '<rootDir>/../care-service/src/$1',
    '^@app/care/(.*)$': '<rootDir>/../care-service/src/$1',
    '^@plan/(.*)$': '<rootDir>/../plan-service/src/$1',
    '^@app/plan/(.*)$': '<rootDir>/../plan-service/src/$1',
    '^@gamification/(.*)$': '<rootDir>/../gamification-engine/src/$1',
    '^@app/gamification/(.*)$': '<rootDir>/../gamification-engine/src/$1',
    '^@notification/(.*)$': '<rootDir>/../notification-service/src/$1',
    '^@app/notification/(.*)$': '<rootDir>/../notification-service/src/$1'
  },
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', {
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
    '/node_modules/(?!(@austa|@app|@shared)/)',
  ],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: '50%',
  
  // Test type configuration
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
};