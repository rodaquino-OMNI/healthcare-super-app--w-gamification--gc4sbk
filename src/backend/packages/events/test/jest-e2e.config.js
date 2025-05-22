/**
 * Jest E2E configuration for the events package
 * 
 * This configuration is specifically designed for end-to-end tests of the events package,
 * with special considerations for Kafka testing. It includes longer timeouts for event
 * processing, retry policies for flaky tests, and proper test isolation.
 */

const { resolve } = require('path');
const rootDir = resolve(__dirname, '..');

module.exports = {
  // Use the custom Kafka test environment for E2E tests
  testEnvironment: resolve(__dirname, './kafka-test-environment.js'),
  
  // Root directory for the events package
  rootDir,
  
  // Specify the test files pattern for E2E tests
  testMatch: ['**/test/e2e/**/*.e2e-spec.{ts,js}'],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }],
  },
  
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: './coverage/e2e',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  
  // Global teardown script to clean up resources
  globalTeardown: '<rootDir>/test/global-teardown.js',
  
  // Longer timeout for Kafka operations (30 seconds)
  // This is necessary because Kafka operations can be slow in test environments
  testTimeout: 30000,
  
  // Retry configuration for flaky tests
  // Kafka tests can be flaky due to timing issues with message processing
  retry: 2,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Test isolation settings
  maxConcurrency: 1, // Run tests sequentially to avoid Kafka topic conflicts
  maxWorkers: 1,     // Use a single worker to ensure isolation
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/../../../$1',
    '^@austa/(.*)$': '<rootDir>/../../$1',
  },
  
  // Environment variables for tests
  // These can be overridden by setting actual environment variables
  testEnvironmentOptions: {
    // Kafka connection settings for tests
    KAFKA_BROKERS: process.env.KAFKA_BROKERS || 'localhost:9092',
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'events-e2e-test-client',
    KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'events-e2e-test-group',
    
    // Schema registry settings
    SCHEMA_REGISTRY_URL: process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081',
    
    // Test database connection (if needed)
    DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_events',
    
    // Logging settings
    LOG_LEVEL: process.env.LOG_LEVEL || 'error',
    
    // Test topic prefix to ensure isolation
    TEST_TOPIC_PREFIX: process.env.TEST_TOPIC_PREFIX || 'test-events-',
    
    // Kafka consumer settings
    CONSUMER_HEARTBEAT_INTERVAL: 1000,  // Faster heartbeats for quicker test completion
    CONSUMER_SESSION_TIMEOUT: 10000,    // Shorter session timeout for tests
    CONSUMER_MAX_POLL_INTERVAL: 15000,  // Maximum time between polls
    CONSUMER_MAX_BYTES: 1048576,        // 1MB max bytes per partition
    
    // Kafka producer settings
    PRODUCER_TRANSACTION_TIMEOUT: 5000,  // Shorter transaction timeout for tests
    PRODUCER_REQUEST_TIMEOUT: 3000,      // Shorter request timeout for tests
    
    // Retry settings for Kafka operations
    KAFKA_RETRY_MAX_RETRIES: 3,
    KAFKA_RETRY_INITIAL_BACKOFF_MS: 100,
    KAFKA_RETRY_MAX_BACKOFF_MS: 1000,
  },
  
  // Detect open handles to identify resource leaks
  // This is important for Kafka tests which can leave connections open
  detectOpenHandles: true,
  
  // Force exit after tests complete
  // This helps with Kafka connection issues that can prevent Jest from exiting
  forceExit: true,
};