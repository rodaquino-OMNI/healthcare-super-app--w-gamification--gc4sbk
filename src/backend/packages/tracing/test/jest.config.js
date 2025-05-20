/**
 * Jest configuration for the @austa/tracing package tests
 *
 * This configuration file sets up the test environment for the tracing package,
 * including coverage reporting, module resolution, and test timeouts.
 * It ensures proper handling of OpenTelemetry's instrumentation in the test environment.
 */

const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');

// Load the tsconfig to use its path mappings
const tsConfigPath = resolve(__dirname, '../tsconfig.json');
let tsConfig;
try {
  tsConfig = require(tsConfigPath);
} catch (e) {
  // Fallback to a basic configuration if tsconfig.json doesn't exist yet
  tsConfig = {
    compilerOptions: {
      baseUrl: './src',
      paths: {
        '@austa/tracing/*': ['*'],
        '@austa/logging': ['../../../logging/src'],
        '@austa/errors': ['../../../errors/src']
      }
    }
  };
}

/** @type {import('jest').Config} */
module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.ts',
    '!<rootDir>/../src/**/*.d.ts',
    '!<rootDir>/../src/**/*.interface.ts',
    '!<rootDir>/../src/**/index.ts',
    '!<rootDir>/../src/**/*.mock.ts',
    '!<rootDir>/../src/**/*.test.ts',
    '!<rootDir>/../src/**/*.spec.ts'
  ],

  // The minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The root directory that Jest should scan for tests and modules within
  rootDir: __dirname,

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>'],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    // Use the paths from tsconfig.json
    ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/../'
    }),
    // Add any additional module name mappings here
    '^@austa/tracing/(.*)$': '<rootDir>/../src/$1'
  },

  // A list of paths to modules that run some code to configure or set up the testing environment
  setupFiles: ['<rootDir>/setup.ts'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: [],

  // The path to a module that runs after all tests are complete
  // This is used to clean up the OpenTelemetry global state
  globalTeardown: '<rootDir>/teardown.ts',

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // A transformer to use for TypeScript files
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: tsConfigPath,
      // Disable type checking for faster tests
      isolatedModules: true,
      // Use ESM for better compatibility with OpenTelemetry
      useESM: false
    }]
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Automatically restore mock state and implementation before every test
  restoreMocks: true,

  // Indicates whether the test should fail if there are any open handles at the end of the test
  // This is important for OpenTelemetry tests to ensure all spans are properly ended
  detectOpenHandles: true,

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // An array of regexp pattern strings that are matched against all test paths before executing the test
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Default timeout of a test in milliseconds
  // Increased for async tracing operations which may take longer
  testTimeout: 10000,

  // A map from regular expressions to paths to transformers
  transformIgnorePatterns: [
    // Don't transform node_modules except for OpenTelemetry packages
    '/node_modules/(?!(@opentelemetry)/)',
  ],

  // Indicates whether the test runner should exit after a test run, even if there are open handles
  // This is set to true to prevent hanging tests due to unclosed OpenTelemetry resources
  forceExit: true,

  // Allows for custom reporters to be used
  reporters: ['default'],

  // Global variables that should be available to all tests
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};