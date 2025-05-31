import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the tsconfig to get the paths mapping
const tsConfigPath = join(__dirname, '..', 'tsconfig.json');
const tsConfigContent = readFileSync(tsConfigPath, 'utf-8');
const tsConfig = JSON.parse(tsConfigContent);

const config: Config = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.ts',
    '!<rootDir>/../src/**/*.spec.ts',
    '!<rootDir>/../src/**/*.test.ts',
    '!<rootDir>/../src/**/*.d.ts',
    '!<rootDir>/../src/**/*.mock.ts',
    '!<rootDir>/../src/**/index.ts',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/../coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/../src/**/*.spec.ts',
    '<rootDir>/../src/**/*.test.ts',
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/'],
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // An array of regexp pattern strings that are matched against all source file paths before re-running tests
  watchPathIgnorePatterns: ['/node_modules/'],
  
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  
  // Automatically restore mock state and implementation before every test
  restoreMocks: true,
  
  // The root directory that Jest should scan for tests and modules within
  rootDir: __dirname,
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/../src'],
  
  // The paths to modules that run some code to configure or set up the testing environment
  setupFiles: ['<rootDir>/setup-tests.ts'],
  
  // A list of paths to modules that run some code to configure or set up the testing framework before each test file
  setupFilesAfterEnv: [],
  
  // The glob patterns Jest uses to detect test files
  testRegex: '\\.(spec|test)\\.ts$',
  
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    // Map the @austa/* imports to their actual paths
    '@austa/(.*)': '<rootDir>/../../$1/src',
    // Map other common imports in the monorepo
    '@app/(.*)': '<rootDir>/../../../$1/src',
    // Map local imports
    '^src/(.*)$': '<rootDir>/../src/$1',
    // Use paths from tsconfig if available
    ...(tsConfig.compilerOptions?.paths ? pathsToModuleNameMapper(tsConfig.compilerOptions.paths, { prefix: '<rootDir>/../' }) : {}),
  },
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // An array of regexp patterns that are matched against all source file paths before transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$',
  ],
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
};

export default config;