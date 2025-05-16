import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../tsconfig.json';

const config: Config.InitialOptions = {
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
    '!../src/**/index.ts',
    '!../src/**/*.module.ts',
    '!../src/**/main.ts',
    '!../src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: '<rootDir>/../coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@austa/auth/(.*)$': '<rootDir>/../src/$1',
    '^@austa/auth$': '<rootDir>/../src',
    '^@austa/interfaces/(.*)$': '<rootDir>/../../interfaces/src/$1',
    '^@austa/interfaces$': '<rootDir>/../../interfaces/src',
    '^@austa/errors/(.*)$': '<rootDir>/../../errors/src/$1',
    '^@austa/errors$': '<rootDir>/../../errors/src',
    '^@austa/database/(.*)$': '<rootDir>/../../database/src/$1',
    '^@austa/database$': '<rootDir>/../../database/src',
    '^@austa/logging/(.*)$': '<rootDir>/../../logging/src/$1',
    '^@austa/logging$': '<rootDir>/../../logging/src',
    '^@austa/events/(.*)$': '<rootDir>/../../events/src/$1',
    '^@austa/events$': '<rootDir>/../../events/src',
    '^@austa/tracing/(.*)$': '<rootDir>/../../tracing/src/$1',
    '^@austa/tracing$': '<rootDir>/../../tracing/src'
  },
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@austa)/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  globals: {
    'ts-jest': {
      tsconfig: '../tsconfig.json',
      isolatedModules: true
    }
  },
  verbose: true,
  testTimeout: 30000,
  maxWorkers: '50%'
};

export default config;