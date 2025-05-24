/**
 * Jest configuration for @austa/design-system
 * 
 * This configuration enables comprehensive testing of design system components
 * across both web and mobile platforms, with proper integration with primitives,
 * interfaces, and journey context packages.
 */

module.exports = {
  // Use the React Native preset as a base for cross-platform testing
  preset: 'react-native',
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.stories.{ts,tsx}',
    '!<rootDir>/src/**/index.{ts,tsx}',
    '!<rootDir>/src/**/__mocks__/**',
    '!<rootDir>/src/**/__tests__/**',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // The minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/'],
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // An array of regexp pattern strings that are matched against all source file paths before re-running tests
  watchPathIgnorePatterns: ['/node_modules/'],
  
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  
  // Automatically restore mock state and implementation before every test
  restoreMocks: true,
  
  // The root directory that Jest should scan for tests and modules within
  rootDir: './',
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],
  
  // The paths to modules that run some code to configure or set up the testing environment
  setupFiles: ['<rootDir>/test/setup-tests.js'],
  
  // A list of paths to modules that run some code to configure or set up the testing framework before each test file
  setupFilesAfterEnv: ['<rootDir>/test/setup-after-env.js'],
  
  // The glob patterns Jest uses to detect test files
  testRegex: '\\.(spec|test)\\.(ts|tsx)$',
  
  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.css$': 'identity-obj-proxy',
    
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Map the @austa/* imports to their actual paths
    '@austa/interfaces/(.*)': '<rootDir>/../interfaces/src/$1',
    '@austa/interfaces': '<rootDir>/../interfaces/src',
    '@austa/journey-context/(.*)': '<rootDir>/../journey-context/src/$1',
    '@austa/journey-context': '<rootDir>/../journey-context/src',
    '@design-system/primitives/(.*)': '<rootDir>/../primitives/src/$1',
    '@design-system/primitives': '<rootDir>/../primitives/src',
  },
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // An array of regexp patterns that are matched against all source file paths before transformation
  transformIgnorePatterns: [
    '/node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@austa|@design-system)/',
  ],
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  
  // Use this configuration option to add custom reporters to Jest
  reporters: ['default'],
  
  // Allows for a label to be printed alongside a test while it is running
  displayName: {
    name: '@austa/design-system',
    color: 'blue',
  },
  
  // Automatically reset mock state between every test
  resetMocks: false,
  
  // Reset the module registry before running each individual test
  resetModules: false,
  
  // This option allows the use of a custom resolver
  resolver: undefined,
  
  // Allows you to use a custom runner instead of Jest's default test runner
  runner: 'jest-runner',
  
  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: [
    'jest-styled-components',
  ],
  
  // Configure haste for React Native platform detection
  haste: {
    defaultPlatform: 'web',
    platforms: ['android', 'ios', 'native', 'web'],
    providesModuleNodeModules: ['react-native'],
  },
  
  // Configure projects for multi-platform testing
  projects: [
    {
      displayName: {
        name: 'Web',
        color: 'blue',
      },
      testEnvironment: 'jsdom',
      haste: {
        defaultPlatform: 'web',
        platforms: ['android', 'ios', 'native', 'web'],
        providesModuleNodeModules: ['react-native'],
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
      ],
    },
    {
      displayName: {
        name: 'iOS',
        color: 'white',
      },
      testEnvironment: 'node',
      haste: {
        defaultPlatform: 'ios',
        platforms: ['android', 'ios', 'native', 'web'],
        providesModuleNodeModules: ['react-native'],
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
      ],
    },
    {
      displayName: {
        name: 'Android',
        color: 'green',
      },
      testEnvironment: 'node',
      haste: {
        defaultPlatform: 'android',
        platforms: ['android', 'ios', 'native', 'web'],
        providesModuleNodeModules: ['react-native'],
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
      ],
    },
  ],
  
  // Global variables that need to be available in all test environments
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      babelConfig: true,
      isolatedModules: true,
    },
  },
};