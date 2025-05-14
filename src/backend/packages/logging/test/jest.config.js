module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../src', '<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.test.ts',
    '**/*.spec.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    '../src/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/*.module.ts',
    '!**/main.ts'
  ],
  coverageDirectory: '<rootDir>/../coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@austa/logging/(.*)$': '<rootDir>/../src/$1',
    '^@austa/logging$': '<rootDir>/../src',
    '^@austa/interfaces/(.*)$': '<rootDir>/../../interfaces/src/$1',
    '^@austa/interfaces$': '<rootDir>/../../interfaces/src',
    '^@austa/tracing/(.*)$': '<rootDir>/../../tracing/src/$1',
    '^@austa/tracing$': '<rootDir>/../../tracing/src',
    '^@austa/utils/(.*)$': '<rootDir>/../../utils/src/$1',
    '^@austa/utils$': '<rootDir>/../../utils/src'
  },
  transform: {
    '^.+\.(t|j)s$': 'ts-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@austa)/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setup-tests.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.json'
    }
  },
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%'
};