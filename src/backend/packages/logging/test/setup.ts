/**
 * Global setup file for logging package tests
 * 
 * This file is executed before any tests run and is responsible for setting up
 * the testing environment to ensure all tests start from a consistent state. It handles:
 * 
 * - Setting up environment variables
 * - Initializing mocks for external dependencies
 * - Configuring global test utilities
 * - Setting up trace context initialization
 * - Implementing cleanup to prevent test pollution
 */

import { AsyncLocalStorage } from 'async_hooks';
import { mockConsole, mockFs, mockCloudWatchLogs, mockTracingService, TEST_TRACE_CONTEXT } from './test-constants';

// Define global types for test environment
declare global {
  // eslint-disable-next-line no-var
  var __ASYNC_STORAGE_INSTANCES__: AsyncLocalStorage<any>[];
  // eslint-disable-next-line no-var
  var __LOG_BUFFERS__: Map<string, any[]>;
  // eslint-disable-next-line no-var
  var __ORIGINAL_ENV__: NodeJS.ProcessEnv;
  // eslint-disable-next-line no-var
  var __MOCK_DATE__: Date | null;
  namespace jest {
    interface Matchers<R> {
      toContainLogEntry(expected: any): R;
      toHaveLogLevel(expected: string): R;
    }
  }
}

/**
 * Main setup function that will be executed before all tests
 */
async function setup(): Promise<void> {
  try {
    // Store original environment variables so they can be restored in teardown
    global.__ORIGINAL_ENV__ = { ...process.env };
    
    // Set up environment variables for testing
    setupEnvironmentVariables();
    
    // Initialize global storage for AsyncLocalStorage instances
    global.__ASYNC_STORAGE_INSTANCES__ = [];
    
    // Initialize global storage for log buffers
    global.__LOG_BUFFERS__ = new Map();
    
    // Set up mock for Date to ensure consistent timestamps in tests
    setupDateMock();
    
    // Set up console mocks
    setupConsoleMocks();
    
    // Set up file system mocks
    setupFsMocks();
    
    // Set up AWS SDK mocks
    setupAwsMocks();
    
    // Set up tracing context
    setupTracingContext();
    
    // Set up custom Jest matchers
    setupCustomMatchers();
    
    console.log('Logging package test setup completed successfully');
  } catch (error) {
    console.error('Error during logging package test setup:', error);
    throw error; // Re-throw to fail the test run if setup fails
  }
}

/**
 * Set up environment variables required for testing
 */
function setupEnvironmentVariables(): void {
  // Set NODE_ENV to 'test'
  process.env.NODE_ENV = 'test';
  
  // Set log level to DEBUG for comprehensive test coverage
  process.env.LOG_LEVEL = 'DEBUG';
  
  // Set service name for consistent context
  process.env.SERVICE_NAME = 'logging-test-service';
  
  // Set up test-specific AWS configuration
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  
  // Disable AWS SDK credential loading to prevent real AWS calls
  process.env.AWS_SDK_LOAD_CONFIG = 'false';
  
  // Set up test-specific log configuration
  process.env.LOG_FORMAT = 'json';
  process.env.LOG_TRANSPORTS = 'console';
  
  // Set up journey context defaults
  process.env.DEFAULT_JOURNEY_TYPE = 'HEALTH';
}

/**
 * Set up mock for Date to ensure consistent timestamps in tests
 */
function setupDateMock(): void {
  // Store the original Date constructor
  const OriginalDate = global.Date;
  global.__MOCK_DATE__ = null;
  
  // Create a mock Date constructor that returns a fixed date when __MOCK_DATE__ is set
  // @ts-ignore - We're intentionally mocking the Date constructor
  global.Date = class extends OriginalDate {
    constructor(...args: any[]) {
      if (args.length === 0 && global.__MOCK_DATE__) {
        super(global.__MOCK_DATE__);
      } else {
        super(...args);
      }
    }
    
    // Ensure static methods work correctly
    static now() {
      return global.__MOCK_DATE__ ? global.__MOCK_DATE__.getTime() : OriginalDate.now();
    }
  };
  
  // Add helper methods to global for controlling the mock date in tests
  global.mockDate = (date: Date | string | number) => {
    global.__MOCK_DATE__ = new OriginalDate(date);
  };
  
  global.resetMockDate = () => {
    global.__MOCK_DATE__ = null;
  };
}

/**
 * Set up console mocks for testing console output
 */
function setupConsoleMocks(): void {
  // Only mock if not already mocked (prevents double mocking)
  if (!global.console.log.mock) {
    jest.spyOn(global.console, 'log').mockImplementation(mockConsole.log);
    jest.spyOn(global.console, 'error').mockImplementation(mockConsole.error);
    jest.spyOn(global.console, 'warn').mockImplementation(mockConsole.warn);
    jest.spyOn(global.console, 'debug').mockImplementation(mockConsole.debug);
    jest.spyOn(global.console, 'info').mockImplementation(mockConsole.info);
  }
  
  // Also mock process.stdout and process.stderr for comprehensive coverage
  if (!process.stdout.write.mock) {
    jest.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      mockConsole.log(chunk.toString());
      return true;
    });
  }
  
  if (!process.stderr.write.mock) {
    jest.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
      mockConsole.error(chunk.toString());
      return true;
    });
  }
}

/**
 * Set up file system mocks for testing file operations
 */
function setupFsMocks(): void {
  // Mock the fs module
  jest.mock('fs', () => ({
    promises: {
      writeFile: mockFs.writeFile,
      appendFile: mockFs.appendFile,
      mkdir: mockFs.mkdir,
      stat: mockFs.stat,
      readdir: mockFs.readdir,
      unlink: mockFs.unlink,
    },
    writeFileSync: jest.fn(),
    appendFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
    unlinkSync: jest.fn(),
    createWriteStream: jest.fn().mockReturnValue({
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
    }),
  }));
}

/**
 * Set up AWS SDK mocks for testing CloudWatch integration
 */
function setupAwsMocks(): void {
  // Mock the AWS SDK
  jest.mock('aws-sdk', () => ({
    CloudWatchLogs: jest.fn().mockImplementation(() => mockCloudWatchLogs),
    config: {
      update: jest.fn(),
    },
  }));
}

/**
 * Set up tracing context for testing distributed tracing integration
 */
function setupTracingContext(): void {
  // Mock the tracing service
  jest.mock('@austa/tracing', () => ({
    TracingService: jest.fn().mockImplementation(() => mockTracingService),
  }));
  
  // Create a global trace context for tests
  global.__TRACE_CONTEXT__ = TEST_TRACE_CONTEXT;
}

/**
 * Set up custom Jest matchers for testing log entries
 */
function setupCustomMatchers(): void {
  // Add custom matchers to Jest
  expect.extend({
    /**
     * Custom matcher to check if a log buffer contains a specific log entry
     */
    toContainLogEntry(received: any[], expected: any) {
      const pass = received.some(entry => {
        // Check if all expected properties exist in the entry
        return Object.entries(expected).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(entry[key]) === JSON.stringify(value);
          }
          return entry[key] === value;
        });
      });
      
      return {
        pass,
        message: () => pass
          ? `Expected log entries not to contain ${JSON.stringify(expected)}`
          : `Expected log entries to contain ${JSON.stringify(expected)}`,
      };
    },
    
    /**
     * Custom matcher to check if a log entry has a specific log level
     */
    toHaveLogLevel(received: any, expected: string) {
      const pass = received.level === expected;
      
      return {
        pass,
        message: () => pass
          ? `Expected log entry not to have level ${expected}`
          : `Expected log entry to have level ${expected}, but got ${received.level}`,
      };
    },
  });
}

/**
 * Helper function to capture logs for testing
 */
export function captureLogsForTest(transportId: string = 'default'): any[] {
  const buffer: any[] = [];
  global.__LOG_BUFFERS__.set(transportId, buffer);
  return buffer;
}

/**
 * Helper function to clear captured logs
 */
export function clearCapturedLogs(transportId: string = 'default'): void {
  const buffer = global.__LOG_BUFFERS__.get(transportId);
  if (buffer) {
    buffer.length = 0;
  }
}

/**
 * Helper function to create a test AsyncLocalStorage context
 */
export function createTestContext<T>(initialValue: T): AsyncLocalStorage<T> {
  const storage = new AsyncLocalStorage<T>();
  global.__ASYNC_STORAGE_INSTANCES__.push(storage);
  return storage;
}

/**
 * Helper function to run a function within a test context
 */
export function runWithTestContext<T, R>(storage: AsyncLocalStorage<T>, value: T, fn: () => R): R {
  return storage.run(value, fn);
}

// Export the setup function as the default export
// This will be picked up by Jest's globalSetup configuration
export default setup;

// Make helper functions available for tests
export {
  mockConsole,
  mockFs,
  mockCloudWatchLogs,
  mockTracingService,
};