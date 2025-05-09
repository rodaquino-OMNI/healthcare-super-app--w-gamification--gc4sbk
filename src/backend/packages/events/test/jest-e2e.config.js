/**
 * Jest E2E configuration for the @austa/events package
 * 
 * This configuration file is specifically designed for end-to-end tests of the events package.
 * It configures longer timeouts for event processing tests, sets up retry policies for flaky
 * Kafka tests, specifies test database connections, and configures the custom Kafka test environment.
 * 
 * @file This file is used when running E2E tests with the command: npm run test:e2e
 */

const path = require('path');
const baseConfig = require('../jest.config');

module.exports = {
  // Extend the base Jest configuration
  ...baseConfig,
  
  // Specify that this is for E2E tests
  testRegex: '.*\.e2e-spec\.ts$',
  
  // Use a different test environment for E2E tests
  testEnvironment: path.join(__dirname, 'kafka-test-environment.js'),
  
  // Configure longer timeouts for event processing tests
  testTimeout: 30000, // 30 seconds
  
  // Set up retry policy for flaky Kafka tests
  retry: 3,
  
  // Global setup and teardown scripts
  globalSetup: path.join(__dirname, 'global-setup.js'),
  globalTeardown: path.join(__dirname, 'global-teardown.js'),
  
  // Setup files to run before each test
  setupFilesAfterEnv: [
    path.join(__dirname, 'jest-setup.ts')
  ],
  
  // Configure test isolation between event test suites
  maxConcurrency: 1, // Run tests sequentially to avoid Kafka conflicts
  maxWorkers: 1,     // Use a single worker for better isolation
  
  // Configure test database connections
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
    // Database configuration for tests
    testDatabase: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/events_test',
      schema: 'events_test',
      synchronize: true,
      logging: false,
    },
    // Kafka configuration for tests
    kafkaConfig: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'events-e2e-test-client',
      consumerGroupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'events-e2e-test-consumer',
      connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '5000', 10),
      operationTimeout: parseInt(process.env.KAFKA_OPERATION_TIMEOUT || '10000', 10),
      topicPrefix: process.env.KAFKA_TEST_TOPIC_PREFIX || 'e2e-test-',
      dlqTopicPrefix: process.env.KAFKA_DLQ_TOPIC_PREFIX || 'dlq-',
      retryConfig: {
        maxAttempts: parseInt(process.env.KAFKA_RETRY_MAX_ATTEMPTS || '3', 10),
        initialDelay: parseInt(process.env.KAFKA_RETRY_INITIAL_DELAY || '100', 10),
        maxDelay: parseInt(process.env.KAFKA_RETRY_MAX_DELAY || '1000', 10),
        factor: parseFloat(process.env.KAFKA_RETRY_FACTOR || '2', 10),
      },
    },
  },
  
  // Configure coverage collection for E2E tests
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.e2e-spec.ts',
    '!<rootDir>/src/**/*.mock.ts',
    '!<rootDir>/src/**/*.dto.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/*.enum.ts',
    '!<rootDir>/src/**/*.constant.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/index.ts',
  ],
  
  // Configure reporters for better test output
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'events-e2e-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        suiteNameTemplate: '{filename}',
      },
    ],
  ],
  
  // Configure verbose output for debugging
  verbose: true,
  
  // Configure test result caching
  cache: false,
  
  // Configure error handling
  bail: 0, // Don't bail on failures, run all tests
  
  // Configure test result formatting
  testLocationInResults: true,
  
  // Configure test result notification
  notify: false,
  
  // Configure test result snapshot handling
  updateSnapshot: 'all',
  
  // Configure test result timing
  slowTestThreshold: 10, // Mark tests as slow if they take more than 10 seconds
};