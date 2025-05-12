/**
 * Jest configuration for end-to-end tests of the events package.
 * 
 * This configuration file sets up:
 * - Longer timeouts for event processing tests
 * - Retry policies for flaky Kafka tests
 * - Test database connections when needed
 * - Custom Kafka test environment
 * 
 * @module jest-e2e.config
 */

const path = require('path');

module.exports = {
  // Display name for this test configuration
  displayName: 'events-e2e',
  
  // Test environment configuration
  testEnvironment: path.join(__dirname, 'kafka-test-environment.js'),
  testEnvironmentOptions: {
    // Kafka configuration for tests
    kafkaBrokerPort: 9092,
    zookeeperPort: 2181,
    topicPrefix: 'test',
    autoCreateTopics: true,
    cleanupTopics: true,
    
    // Additional Kafka options
    kafka: {
      clientId: 'events-e2e-test-client',
      connectionTimeout: 5000,
      authenticationTimeout: 5000,
    },
  },
  
  // Test file patterns
  testMatch: [
    '**/*.e2e-spec.ts',
    '**/*.e2e-test.ts',
  ],
  
  // Root directory for resolving modules
  rootDir: path.join(__dirname, '..'),
  
  // Module file extensions to handle
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: path.join(__dirname, '..', 'tsconfig.json'),
      isolatedModules: true,
    }],
  },
  
  // Setup files
  setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.ts')],
  
  // Global teardown script
  globalTeardown: path.join(__dirname, 'global-teardown.js'),
  
  // Test timeout configuration (longer for E2E tests)
  testTimeout: 30000, // 30 seconds for individual tests
  
  // Retry configuration for flaky tests
  retry: 3,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Coverage configuration
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/**/*.mock.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/*.e2e-test.ts',
  ],
  coverageDirectory: path.join(__dirname, '..', 'coverage', 'e2e'),
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
  
  // Fail tests on warnings
  bail: 0,
  
  // Automatically clear mock calls between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be restored from the cache
  restoreMocks: true,
  
  // Indicates whether each individual test should be reported during the run
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: path.join(__dirname, '..', 'reports'),
      outputName: 'events-e2e-junit.xml',
    }],
  ],
  
  // Global variables available in all test files
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
    // Environment variables for tests
    __E2E_TEST__: true,
  },
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@app/events/(.*)$': '<rootDir>/src/$1',
    '^@app/shared/(.*)$': '<rootDir>/../../../shared/src/$1',
    '^@austa/interfaces/(.*)$': '<rootDir>/../interfaces/$1',
    '^@austa/(.*)$': '<rootDir>/../$1',
  },
  
  // Test sequencer configuration
  testSequencer: path.join(__dirname, 'custom-test-sequencer.js'),
  
  // Additional configuration for E2E tests
  maxWorkers: process.env.CI ? 2 : '50%', // Limit parallel execution in CI
  maxConcurrency: 5, // Limit concurrent tests to prevent Kafka connection issues
  
  // Database configuration for tests that need it
  // These will be available as environment variables in tests
  testEnvironmentVariables: {
    // Database connection for tests
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/events_test',
    // Redis connection for tests
    REDIS_URL: 'redis://localhost:6379/1',
    // Kafka configuration
    KAFKA_BROKERS: 'localhost:9092',
    KAFKA_CLIENT_ID: 'events-e2e-test-client',
    KAFKA_GROUP_ID: 'events-e2e-test-group',
    // Event topics
    KAFKA_HEALTH_TOPIC: 'health.events.test',
    KAFKA_CARE_TOPIC: 'care.events.test',
    KAFKA_PLAN_TOPIC: 'plan.events.test',
    KAFKA_USER_TOPIC: 'user.events.test',
    KAFKA_GAME_TOPIC: 'game.events.test',
    KAFKA_DLQ_TOPIC: 'dlq.events.test',
    // Test mode flag
    NODE_ENV: 'test',
  },
  
  // Notification configuration
  notify: false,
  notifyMode: 'failure-change',
  
  // Projects configuration for multi-project runner
  projects: null,
  
  // Automatically reset mock state between every test
  resetMocks: false,
  
  // Reset the module registry before running each individual test
  resetModules: false,
};