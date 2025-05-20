import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LogEntry } from '../../src/formatters/formatter.interface';
import { MockTransport } from './transport.mock';
import { MockFormatter } from './formatter.mock';
import { MockLoggerService } from './logger.service.mock';
import { MockContextManager } from './context-manager.mock';
import { MockConfigService } from './config.service.mock';

/**
 * Global state for test isolation
 */
interface TestState {
  transports: MockTransport[];
  formatters: MockFormatter[];
  loggers: MockLoggerService[];
  contextManagers: MockContextManager[];
  configServices: MockConfigService[];
}

// Global state to track created test objects for cleanup
const testState: TestState = {
  transports: [],
  formatters: [],
  loggers: [],
  contextManagers: [],
  configServices: [],
};

/**
 * Creates a default test configuration for the logger
 * @returns A default LoggerConfig for testing
 */
export function createTestLoggerConfig(): LoggerConfig {
  return {
    level: LogLevel.DEBUG,
    appName: 'test-app',
    serviceContext: {
      service: 'test-service',
      version: '1.0.0',
      environment: 'test',
    },
    transports: {
      console: {
        enabled: true,
        level: LogLevel.DEBUG,
      },
      file: {
        enabled: false,
      },
      cloudwatch: {
        enabled: false,
      },
    },
    formatter: 'text',
    defaultContext: {
      correlationId: 'test-correlation-id',
    },
  };
}

/**
 * Creates a mock transport for testing
 * @param options Configuration options for the mock transport
 * @returns A configured MockTransport instance
 */
export function createMockTransport(options: {
  name?: string;
  shouldFail?: boolean;
  failureMessage?: string;
  delay?: number;
} = {}): MockTransport {
  const transport = new MockTransport({
    name: options.name || 'test-transport',
    shouldFail: options.shouldFail || false,
    failureMessage: options.failureMessage || 'Transport write failed',
    delay: options.delay || 0,
  });
  
  testState.transports.push(transport);
  return transport;
}

/**
 * Creates a mock formatter for testing
 * @param options Configuration options for the mock formatter
 * @returns A configured MockFormatter instance
 */
export function createMockFormatter(options: {
  name?: string;
  outputFormat?: string;
  shouldFail?: boolean;
  failureMessage?: string;
} = {}): MockFormatter {
  const formatter = new MockFormatter({
    name: options.name || 'test-formatter',
    outputFormat: options.outputFormat || 'formatted-log',
    shouldFail: options.shouldFail || false,
    failureMessage: options.failureMessage || 'Formatter format failed',
  });
  
  testState.formatters.push(formatter);
  return formatter;
}

/**
 * Creates a mock logger service for testing
 * @param options Configuration options for the mock logger
 * @returns A configured MockLoggerService instance
 */
export function createMockLogger(options: {
  config?: Partial<LoggerConfig>;
  transport?: Transport;
  formatter?: Formatter;
} = {}): MockLoggerService {
  const logger = new MockLoggerService({
    config: options.config ? { ...createTestLoggerConfig(), ...options.config } : createTestLoggerConfig(),
    transport: options.transport || createMockTransport(),
    formatter: options.formatter || createMockFormatter(),
  });
  
  testState.loggers.push(logger);
  return logger;
}

/**
 * Creates a mock context manager for testing
 * @param options Configuration options for the mock context manager
 * @returns A configured MockContextManager instance
 */
export function createMockContextManager(options: {
  initialContext?: Record<string, any>;
} = {}): MockContextManager {
  const contextManager = new MockContextManager({
    initialContext: options.initialContext || {},
  });
  
  testState.contextManagers.push(contextManager);
  return contextManager;
}

/**
 * Creates a mock config service for testing
 * @param options Configuration options for the mock config service
 * @returns A configured MockConfigService instance
 */
export function createMockConfigService(options: {
  initialConfig?: Record<string, any>;
} = {}): MockConfigService {
  const configService = new MockConfigService({
    initialConfig: options.initialConfig || {},
  });
  
  testState.configServices.push(configService);
  return configService;
}

/**
 * Creates a test request context for logging tests
 * @param options Custom properties to include in the request context
 * @returns A request context object for testing
 */
export function createTestRequestContext(options: {
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
} = {}): Record<string, any> {
  return {
    requestId: options.requestId || 'test-request-id',
    method: options.method || 'GET',
    url: options.url || '/api/test',
    ip: options.ip || '127.0.0.1',
    userAgent: options.userAgent || 'Test User Agent',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a test user context for logging tests
 * @param options Custom properties to include in the user context
 * @returns A user context object for testing
 */
export function createTestUserContext(options: {
  userId?: string;
  username?: string;
  roles?: string[];
  isAuthenticated?: boolean;
} = {}): Record<string, any> {
  return {
    userId: options.userId || 'test-user-id',
    username: options.username || 'test-user',
    roles: options.roles || ['user'],
    isAuthenticated: options.isAuthenticated !== undefined ? options.isAuthenticated : true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a test journey context for logging tests
 * @param options Custom properties to include in the journey context
 * @returns A journey context object for testing
 */
export function createTestJourneyContext(options: {
  journeyType?: 'Health' | 'Care' | 'Plan';
  journeyId?: string;
  journeyState?: Record<string, any>;
} = {}): Record<string, any> {
  return {
    journeyType: options.journeyType || 'Health',
    journeyId: options.journeyId || 'test-journey-id',
    journeyState: options.journeyState || { step: 'initial' },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a combined test context with request, user, and journey information
 * @param options Custom properties for each context type
 * @returns A combined context object for testing
 */
export function createTestCombinedContext(options: {
  request?: Record<string, any>;
  user?: Record<string, any>;
  journey?: Record<string, any>;
  correlationId?: string;
} = {}): Record<string, any> {
  return {
    request: options.request || createTestRequestContext(),
    user: options.user || createTestUserContext(),
    journey: options.journey || createTestJourneyContext(),
    correlationId: options.correlationId || 'test-correlation-id',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a test log entry for validation
 * @param options Custom properties for the log entry
 * @returns A LogEntry object for testing
 */
export function createTestLogEntry(options: {
  level?: LogLevel;
  message?: string;
  context?: Record<string, any>;
  error?: Error;
  metadata?: Record<string, any>;
} = {}): LogEntry {
  return {
    level: options.level || LogLevel.INFO,
    message: options.message || 'Test log message',
    context: options.context || createTestCombinedContext(),
    error: options.error,
    metadata: options.metadata || {},
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that a log entry contains the expected properties
 * @param entry The log entry to validate
 * @param expected The expected properties
 * @returns true if the entry matches the expected properties
 */
export function validateLogEntry(entry: LogEntry, expected: Partial<LogEntry>): boolean {
  if (expected.level !== undefined && entry.level !== expected.level) {
    return false;
  }
  
  if (expected.message !== undefined && entry.message !== expected.message) {
    return false;
  }
  
  if (expected.error !== undefined && entry.error !== expected.error) {
    return false;
  }
  
  if (expected.context !== undefined) {
    // Check that all expected context properties exist in the entry context
    for (const [key, value] of Object.entries(expected.context)) {
      if (entry.context?.[key] !== value) {
        return false;
      }
    }
  }
  
  if (expected.metadata !== undefined) {
    // Check that all expected metadata properties exist in the entry metadata
    for (const [key, value] of Object.entries(expected.metadata)) {
      if (entry.metadata?.[key] !== value) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validates that a formatted log string contains expected substrings
 * @param formattedLog The formatted log string to validate
 * @param expectedSubstrings Array of substrings that should be present in the log
 * @returns true if all expected substrings are present
 */
export function validateFormattedLog(formattedLog: string, expectedSubstrings: string[]): boolean {
  return expectedSubstrings.every(substring => formattedLog.includes(substring));
}

/**
 * Sets up a test environment with isolated mocks
 * @param options Configuration options for the test environment
 * @returns An object containing all created mocks
 */
export function setupTestEnvironment(options: {
  loggerConfig?: Partial<LoggerConfig>;
  initialContext?: Record<string, any>;
  shouldFailTransport?: boolean;
  shouldFailFormatter?: boolean;
} = {}) {
  const formatter = createMockFormatter({
    shouldFail: options.shouldFailFormatter || false,
  });
  
  const transport = createMockTransport({
    shouldFail: options.shouldFailTransport || false,
  });
  
  const contextManager = createMockContextManager({
    initialContext: options.initialContext || {},
  });
  
  const configService = createMockConfigService({
    initialConfig: {
      logging: options.loggerConfig ? { ...createTestLoggerConfig(), ...options.loggerConfig } : createTestLoggerConfig(),
    },
  });
  
  const logger = createMockLogger({
    config: options.loggerConfig,
    formatter,
    transport,
  });
  
  return {
    formatter,
    transport,
    contextManager,
    configService,
    logger,
  };
}

/**
 * Tears down the test environment and resets all mocks
 */
export function teardownTestEnvironment(): void {
  // Reset all tracked objects
  testState.transports.forEach(transport => transport.reset());
  testState.formatters.forEach(formatter => formatter.reset());
  testState.loggers.forEach(logger => logger.reset());
  testState.contextManagers.forEach(contextManager => contextManager.reset());
  testState.configServices.forEach(configService => configService.reset());
  
  // Clear the arrays
  testState.transports = [];
  testState.formatters = [];
  testState.loggers = [];
  testState.contextManagers = [];
  testState.configServices = [];
}

/**
 * Waits for all async operations to complete
 * Useful for testing async logging operations
 * @param ms Time to wait in milliseconds
 * @returns A promise that resolves after the specified time
 */
export function waitForAsync(ms = 10): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a test error with a predictable stack trace
 * @param message The error message
 * @param options Additional error properties
 * @returns An Error object for testing
 */
export function createTestError(message = 'Test error', options: {
  code?: string;
  cause?: Error;
  metadata?: Record<string, any>;
} = {}): Error {
  const error = new Error(message);
  
  if (options.code) {
    (error as any).code = options.code;
  }
  
  if (options.cause) {
    (error as any).cause = options.cause;
  }
  
  if (options.metadata) {
    (error as any).metadata = options.metadata;
  }
  
  return error;
}

/**
 * Creates a test journey-specific error
 * @param journeyType The type of journey (Health, Care, Plan)
 * @param message The error message
 * @param options Additional error properties
 * @returns A journey-specific Error object for testing
 */
export function createJourneyError(
  journeyType: 'Health' | 'Care' | 'Plan',
  message = `${journeyType} journey error`,
  options: {
    code?: string;
    cause?: Error;
    metadata?: Record<string, any>;
  } = {}
): Error {
  const error = createTestError(message, options);
  (error as any).journeyType = journeyType;
  return error;
}