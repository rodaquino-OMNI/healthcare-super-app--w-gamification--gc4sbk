import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { JourneyType } from '../../src/context/context.constants';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { ContextManager } from '../../src/context/context-manager';

/**
 * Mock implementation of the TracingService for testing purposes.
 * This mock provides the minimum functionality needed for integration tests
 * without requiring the actual tracing infrastructure.
 */
export class MockTracingService {
  private currentTraceId: string = 'test-trace-id';
  private currentSpanId: string = 'test-span-id';
  private spans: Map<string, any> = new Map();

  /**
   * Creates a new span for the specified operation
   * @param name The name of the operation being traced
   * @param options Optional configuration for the span
   * @returns A span ID that can be used to reference this span
   */
  createSpan(name: string, options?: any): string {
    const spanId = `span-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.spans.set(spanId, {
      name,
      startTime: Date.now(),
      attributes: options?.attributes || {},
      events: [],
      status: 'unset',
    });
    return spanId;
  }

  /**
   * Ends a previously created span
   * @param spanId The ID of the span to end
   * @param options Optional end options including error information
   */
  endSpan(spanId: string, options?: { error?: Error }): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
      
      if (options?.error) {
        span.status = 'error';
        span.error = {
          message: options.error.message,
          stack: options.error.stack,
          name: options.error.name,
        };
      } else {
        span.status = 'ok';
      }
    }
  }

  /**
   * Gets the current trace ID
   * @returns The current trace ID
   */
  getCurrentTraceId(): string {
    return this.currentTraceId;
  }

  /**
   * Gets the current span ID
   * @returns The current span ID
   */
  getCurrentSpanId(): string {
    return this.currentSpanId;
  }

  /**
   * Sets the current trace context for testing
   * @param traceId The trace ID to set
   * @param spanId The span ID to set
   */
  setCurrentTraceContext(traceId: string, spanId: string): void {
    this.currentTraceId = traceId;
    this.currentSpanId = spanId;
  }

  /**
   * Gets all recorded spans for verification
   * @returns A map of all spans created during the test
   */
  getRecordedSpans(): Map<string, any> {
    return this.spans;
  }

  /**
   * Clears all recorded spans
   */
  clearSpans(): void {
    this.spans.clear();
  }
}

/**
 * Mock transport implementation that captures log entries for verification
 * without actually writing them to any external system.
 */
export class MockTransport implements Transport {
  private entries: LogEntry[] = [];
  private name: string;
  private shouldFail: boolean = false;

  /**
   * Creates a new MockTransport
   * @param name A name for this transport instance
   */
  constructor(name: string = 'mock-transport') {
    this.name = name;
  }

  /**
   * Initializes the transport
   */
  async initialize(): Promise<void> {
    // No initialization needed for mock
  }

  /**
   * Writes a log entry to this transport
   * @param entry The log entry to write
   * @param formattedEntry The formatted version of the entry
   */
  async write(entry: LogEntry, formattedEntry: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(`Mock transport ${this.name} was configured to fail`);
    }
    this.entries.push({ ...entry });
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    // No cleanup needed for mock
  }

  /**
   * Gets all captured log entries
   * @returns Array of captured log entries
   */
  getCapturedEntries(): LogEntry[] {
    return this.entries;
  }

  /**
   * Clears all captured log entries
   */
  clearEntries(): void {
    this.entries = [];
  }

  /**
   * Configures this transport to fail on write operations
   * @param shouldFail Whether write operations should fail
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  /**
   * Gets the name of this transport
   * @returns The transport name
   */
  getName(): string {
    return this.name;
  }
}

/**
 * Creates a test NestJS module with LoggerModule and optional additional providers
 * @param config Optional logger configuration
 * @param additionalProviders Optional additional providers to include in the test module
 * @returns A TestingModule instance
 */
export async function createTestLoggerModule(
  config?: Partial<LoggerConfig>,
  additionalProviders: any[] = []
): Promise<TestingModule> {
  const moduleMetadata: ModuleMetadata = {
    imports: [LoggerModule.forRoot(config)],
    providers: [
      {
        provide: 'TracingService',
        useClass: MockTracingService,
      },
      ...additionalProviders,
    ],
  };

  return Test.createTestingModule(moduleMetadata).compile();
}

/**
 * Creates a standard set of test contexts for use in logging tests
 * @returns An object containing various test contexts
 */
export function createTestContexts() {
  return {
    empty: {} as LoggingContext,
    basic: {
      requestId: 'test-request-123',
      correlationId: 'test-correlation-123',
      sessionId: 'test-session-123',
      applicationName: 'test-app',
      serviceName: 'test-service',
    } as LoggingContext,
    journey: {
      requestId: 'test-request-456',
      correlationId: 'test-correlation-456',
      sessionId: 'test-session-456',
      applicationName: 'test-app',
      serviceName: 'test-service',
      journeyType: JourneyType.HEALTH,
      journeyId: 'health-journey-123',
      journeyStep: 'metrics-recording',
    } as JourneyContext,
    user: {
      requestId: 'test-request-789',
      correlationId: 'test-correlation-789',
      sessionId: 'test-session-789',
      applicationName: 'test-app',
      serviceName: 'test-service',
      userId: 'user-123',
      userEmail: 'test@example.com',
      isAuthenticated: true,
      roles: ['user', 'premium'],
    } as UserContext,
    request: {
      requestId: 'test-request-101',
      correlationId: 'test-correlation-101',
      sessionId: 'test-session-101',
      applicationName: 'test-app',
      serviceName: 'test-service',
      method: 'GET',
      url: '/api/health/metrics',
      userAgent: 'Test Agent 1.0',
      ip: '127.0.0.1',
      path: '/api/health/metrics',
    } as RequestContext,
    complete: {
      requestId: 'test-request-202',
      correlationId: 'test-correlation-202',
      sessionId: 'test-session-202',
      applicationName: 'test-app',
      serviceName: 'test-service',
      traceId: 'test-trace-202',
      spanId: 'test-span-202',
      userId: 'user-202',
      userEmail: 'complete@example.com',
      isAuthenticated: true,
      roles: ['user', 'admin'],
      journeyType: JourneyType.CARE,
      journeyId: 'care-journey-202',
      journeyStep: 'appointment-booking',
      method: 'POST',
      url: '/api/care/appointments',
      userAgent: 'Test Agent 2.0',
      ip: '127.0.0.2',
      path: '/api/care/appointments',
    } as LoggingContext,
  };
}

/**
 * Creates a standard set of test errors for use in logging tests
 * @returns An object containing various test errors
 */
export function createTestErrors() {
  const simpleError = new Error('A simple test error');
  
  const nestedError = new Error('A nested error occurred');
  const wrappedError = new Error('Wrapper error');
  wrappedError.cause = nestedError;
  
  // Create an error with a custom property
  const customError = new Error('Custom error with properties');
  (customError as any).code = 'ERR_CUSTOM';
  (customError as any).details = { field: 'username', constraint: 'required' };

  // Create a validation error
  class ValidationError extends Error {
    constructor(message: string, public fields: Record<string, string>) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  const validationError = new ValidationError('Validation failed', {
    email: 'Invalid email format',
    password: 'Password too short',
  });

  return {
    simpleError,
    nestedError,
    wrappedError,
    customError,
    validationError,
  };
}

/**
 * Helper to capture console output during tests
 * @returns An object with methods to start and stop capturing, and get captured output
 */
export function createConsoleCapturer() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  let captured: { level: string; message: string }[] = [];

  return {
    /**
     * Starts capturing console output
     */
    startCapturing: () => {
      console.log = (message: string) => {
        captured.push({ level: 'log', message: String(message) });
      };
      console.error = (message: string) => {
        captured.push({ level: 'error', message: String(message) });
      };
      console.warn = (message: string) => {
        captured.push({ level: 'warn', message: String(message) });
      };
      console.info = (message: string) => {
        captured.push({ level: 'info', message: String(message) });
      };
      console.debug = (message: string) => {
        captured.push({ level: 'debug', message: String(message) });
      };
    },

    /**
     * Stops capturing and restores original console methods
     */
    stopCapturing: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    },

    /**
     * Gets all captured console output
     * @returns Array of captured console messages with their log levels
     */
    getCapturedOutput: () => [...captured],

    /**
     * Clears all captured console output
     */
    clearCapturedOutput: () => {
      captured = [];
    },
  };
}

/**
 * Helper to create a test file system for testing file transports
 * @returns An object with methods to create, read, and delete test log files
 */
export function createTestFileSystem() {
  const files: Record<string, string[]> = {};

  return {
    /**
     * Writes a line to a test log file
     * @param filePath The path of the file to write to
     * @param line The line to write
     */
    writeLine: (filePath: string, line: string) => {
      if (!files[filePath]) {
        files[filePath] = [];
      }
      files[filePath].push(line);
    },

    /**
     * Reads all lines from a test log file
     * @param filePath The path of the file to read
     * @returns Array of lines from the file, or empty array if file doesn't exist
     */
    readLines: (filePath: string) => {
      return files[filePath] || [];
    },

    /**
     * Deletes a test log file
     * @param filePath The path of the file to delete
     */
    deleteFile: (filePath: string) => {
      delete files[filePath];
    },

    /**
     * Checks if a test log file exists
     * @param filePath The path of the file to check
     * @returns True if the file exists, false otherwise
     */
    fileExists: (filePath: string) => {
      return !!files[filePath];
    },

    /**
     * Gets all test log files
     * @returns Record of all test log files and their contents
     */
    getAllFiles: () => ({ ...files }),

    /**
     * Clears all test log files
     */
    clearAllFiles: () => {
      Object.keys(files).forEach(key => delete files[key]);
    },
  };
}

/**
 * Helper to create assertions for log entries
 * @returns An object with methods to assert properties of log entries
 */
export function createLogAssertions() {
  return {
    /**
     * Asserts that a log entry has the expected level
     * @param entry The log entry to check
     * @param expectedLevel The expected log level
     */
    assertLogLevel: (entry: LogEntry, expectedLevel: LogLevel) => {
      expect(entry.level).toBe(expectedLevel);
    },

    /**
     * Asserts that a log entry has the expected message
     * @param entry The log entry to check
     * @param expectedMessage The expected message
     */
    assertLogMessage: (entry: LogEntry, expectedMessage: string) => {
      expect(entry.message).toBe(expectedMessage);
    },

    /**
     * Asserts that a log entry has the expected context properties
     * @param entry The log entry to check
     * @param expectedContext The expected context properties
     */
    assertLogContext: (entry: LogEntry, expectedContext: Partial<LoggingContext>) => {
      Object.entries(expectedContext).forEach(([key, value]) => {
        expect(entry.context).toHaveProperty(key, value);
      });
    },

    /**
     * Asserts that a log entry has trace correlation IDs
     * @param entry The log entry to check
     * @param expectedTraceId The expected trace ID
     * @param expectedSpanId The expected span ID
     */
    assertTraceCorrelation: (entry: LogEntry, expectedTraceId: string, expectedSpanId: string) => {
      expect(entry.context).toHaveProperty('traceId', expectedTraceId);
      expect(entry.context).toHaveProperty('spanId', expectedSpanId);
    },

    /**
     * Asserts that a log entry has journey context
     * @param entry The log entry to check
     * @param journeyType The expected journey type
     * @param journeyId The expected journey ID
     */
    assertJourneyContext: (entry: LogEntry, journeyType: JourneyType, journeyId: string) => {
      expect(entry.context).toHaveProperty('journeyType', journeyType);
      expect(entry.context).toHaveProperty('journeyId', journeyId);
    },

    /**
     * Asserts that a log entry has user context
     * @param entry The log entry to check
     * @param userId The expected user ID
     * @param isAuthenticated The expected authentication status
     */
    assertUserContext: (entry: LogEntry, userId: string, isAuthenticated: boolean = true) => {
      expect(entry.context).toHaveProperty('userId', userId);
      expect(entry.context).toHaveProperty('isAuthenticated', isAuthenticated);
    },

    /**
     * Asserts that a log entry has request context
     * @param entry The log entry to check
     * @param method The expected HTTP method
     * @param path The expected request path
     */
    assertRequestContext: (entry: LogEntry, method: string, path: string) => {
      expect(entry.context).toHaveProperty('method', method);
      expect(entry.context).toHaveProperty('path', path);
    },

    /**
     * Asserts that a log entry has error information
     * @param entry The log entry to check
     * @param errorMessage The expected error message
     */
    assertErrorContext: (entry: LogEntry, errorMessage: string) => {
      expect(entry.error).toBeDefined();
      expect(entry.error?.message).toBe(errorMessage);
      expect(entry.error?.stack).toBeDefined();
    },

    /**
     * Asserts that a formatted log entry (string) contains expected substrings
     * @param formattedEntry The formatted log entry
     * @param expectedSubstrings Array of substrings that should be present
     */
    assertFormattedLogContains: (formattedEntry: string, expectedSubstrings: string[]) => {
      expectedSubstrings.forEach(substring => {
        expect(formattedEntry).toContain(substring);
      });
    },
  };
}

/**
 * Creates a test context manager for integration tests
 * @returns A ContextManager instance for testing
 */
export function createTestContextManager(): ContextManager {
  return new ContextManager();
}

/**
 * Creates a standard test configuration for the logger
 * @param overrides Optional configuration overrides
 * @returns A LoggerConfig object for testing
 */
export function createTestLoggerConfig(overrides?: Partial<LoggerConfig>): LoggerConfig {
  return {
    level: LogLevel.DEBUG,
    transports: [],
    defaultContext: {
      applicationName: 'test-application',
      serviceName: 'test-service',
    },
    ...overrides,
  };
}

/**
 * Helper to create a test service that uses the LoggerService
 * @param logger The LoggerService instance to use
 * @returns A test service with methods that use the logger
 */
export function createTestService(logger: LoggerService) {
  return {
    /**
     * Performs a simple operation that logs at different levels
     * @param input The input to the operation
     * @returns The result of the operation
     */
    performOperation: (input: string) => {
      logger.debug(`Starting operation with input: ${input}`, { operationName: 'performOperation' });
      
      try {
        if (input === 'error') {
          throw new Error('Operation failed');
        }
        
        logger.info(`Operation completed successfully with input: ${input}`, { 
          operationName: 'performOperation',
          result: 'success',
        });
        
        return `Processed: ${input}`;
      } catch (error) {
        logger.error(`Operation failed with input: ${input}`, error as Error, { 
          operationName: 'performOperation',
          result: 'error',
        });
        throw error;
      }
    },

    /**
     * Performs an operation with journey context
     * @param journeyType The journey type
     * @param input The input to the operation
     * @returns The result of the operation
     */
    performJourneyOperation: (journeyType: JourneyType, input: string) => {
      const context: JourneyContext = {
        journeyType,
        journeyId: `journey-${Date.now()}`,
        journeyStep: 'test-step',
      } as JourneyContext;

      logger.log(`Performing journey operation: ${input}`, context);
      return `Journey ${journeyType} processed: ${input}`;
    },

    /**
     * Performs an operation with user context
     * @param userId The user ID
     * @param input The input to the operation
     * @returns The result of the operation
     */
    performUserOperation: (userId: string, input: string) => {
      const context: UserContext = {
        userId,
        isAuthenticated: true,
        roles: ['user'],
      } as UserContext;

      logger.log(`Performing user operation: ${input}`, context);
      return `User ${userId} processed: ${input}`;
    },

    /**
     * Performs an operation with request context
     * @param method The HTTP method
     * @param path The request path
     * @param input The input to the operation
     * @returns The result of the operation
     */
    performRequestOperation: (method: string, path: string, input: string) => {
      const context: RequestContext = {
        method,
        path,
        url: `https://example.com${path}`,
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
      } as RequestContext;

      logger.log(`Performing request operation: ${input}`, context);
      return `Request ${method} ${path} processed: ${input}`;
    },
  };
}