/**
 * Test utilities for the logging package
 * 
 * This file provides utility functions for setting up and cleaning up test environments
 * for logging components. It includes helpers for creating mock contexts, configuring
 * test logging environments, and resetting state between tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerModule } from '../../src/logger.module';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { JourneyType } from '../../src/context/context.constants';
import { ContextManager } from '../../src/context/context-manager';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';

/**
 * Mock transport that captures log entries for testing
 */
export class MockTransport implements Transport {
  public logs: LogEntry[] = [];
  public initialized = false;
  public closed = false;
  public failOnWrite = false;

  constructor(public readonly name: string = 'mock-transport') {}

  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  async write(entry: LogEntry): Promise<void> {
    if (this.failOnWrite) {
      return Promise.reject(new Error('Mock transport write failure'));
    }
    this.logs.push({ ...entry });
    return Promise.resolve();
  }

  async close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  reset(): void {
    this.logs = [];
    this.initialized = false;
    this.closed = false;
    this.failOnWrite = false;
  }
}

/**
 * Mock formatter that captures log entries for testing
 */
export class MockFormatter implements Formatter {
  public formatted: string[] = [];
  public entries: LogEntry[] = [];
  public failOnFormat = false;

  constructor(public readonly name: string = 'mock-formatter') {}

  format(entry: LogEntry): string {
    if (this.failOnFormat) {
      throw new Error('Mock formatter failure');
    }
    this.entries.push({ ...entry });
    const formatted = JSON.stringify(entry);
    this.formatted.push(formatted);
    return formatted;
  }

  reset(): void {
    this.formatted = [];
    this.entries = [];
    this.failOnFormat = false;
  }
}

/**
 * Interface for test logger configuration
 */
export interface TestLoggerConfig {
  level?: LogLevel;
  transports?: Transport[];
  formatter?: Formatter;
  contextManager?: ContextManager;
}

/**
 * Creates a test logger service with mock dependencies
 */
export async function createTestLogger(config?: TestLoggerConfig): Promise<{
  logger: LoggerService;
  module: TestingModule;
  mockTransport: MockTransport;
  mockFormatter: MockFormatter;
}> {
  const mockTransport = new MockTransport();
  const mockFormatter = new MockFormatter();

  const moduleRef = await Test.createTestingModule({
    imports: [
      LoggerModule.forRoot({
        level: config?.level || LogLevel.DEBUG,
        transports: config?.transports || [mockTransport],
        formatter: config?.formatter || mockFormatter,
      }),
    ],
  }).compile();

  const logger = moduleRef.get<LoggerService>(LoggerService);

  return {
    logger,
    module: moduleRef,
    mockTransport,
    mockFormatter,
  };
}

/**
 * Creates a real logger service with actual implementations for integration testing
 */
export async function createIntegrationLogger(config?: TestLoggerConfig): Promise<{
  logger: LoggerService;
  module: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      LoggerModule.forRoot({
        level: config?.level || LogLevel.DEBUG,
        transports: config?.transports || [new ConsoleTransport()],
        formatter: config?.formatter || new TextFormatter(),
      }),
    ],
  }).compile();

  const logger = moduleRef.get<LoggerService>(LoggerService);

  return {
    logger,
    module: moduleRef,
  };
}

/**
 * Creates a mock request context for testing
 */
export function createMockRequestContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    requestId: 'test-request-id',
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
    userAgent: 'Jest Test Runner',
    params: {},
    headers: {},
    ...overrides,
  };
}

/**
 * Creates a mock user context for testing
 */
export function createMockUserContext(overrides?: Partial<UserContext>): UserContext {
  return {
    userId: 'test-user-id',
    authenticated: true,
    roles: ['user'],
    permissions: [],
    ...overrides,
  };
}

/**
 * Creates a mock journey context for testing
 */
export function createMockJourneyContext(
  journeyType: JourneyType = JourneyType.HEALTH,
  overrides?: Partial<JourneyContext>
): JourneyContext {
  return {
    journeyType,
    journeyId: `test-${journeyType.toLowerCase()}-journey-id`,
    journeyState: {},
    ...overrides,
  };
}

/**
 * Creates a combined context with request, user, and journey information
 */
export function createMockCombinedContext(overrides?: {
  request?: Partial<RequestContext>;
  user?: Partial<UserContext>;
  journey?: Partial<JourneyContext>;
  journeyType?: JourneyType;
}): LoggingContext {
  const journeyType = overrides?.journeyType || JourneyType.HEALTH;
  
  return {
    ...createMockRequestContext(overrides?.request),
    ...createMockUserContext(overrides?.user),
    ...createMockJourneyContext(journeyType, overrides?.journey),
    correlationId: 'test-correlation-id',
    timestamp: new Date().toISOString(),
    service: 'test-service',
  };
}

/**
 * Creates a mock error with stack trace for testing error logging
 */
export function createMockError(message = 'Test error', code = 'TEST_ERROR', metadata?: Record<string, any>): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).metadata = metadata;
  return error;
}

/**
 * Creates a mock log entry for testing formatters and transports
 */
export function createMockLogEntry(overrides?: Partial<LogEntry>): LogEntry {
  return {
    level: LogLevel.INFO,
    message: 'Test log message',
    timestamp: new Date().toISOString(),
    context: createMockCombinedContext(),
    correlationId: 'test-correlation-id',
    service: 'test-service',
    ...overrides,
  };
}

/**
 * Utility to verify if a log entry contains expected data
 */
export function verifyLogEntry(entry: LogEntry, expected: Partial<LogEntry>): boolean {
  if (expected.level && entry.level !== expected.level) return false;
  if (expected.message && entry.message !== expected.message) return false;
  if (expected.correlationId && entry.correlationId !== expected.correlationId) return false;
  if (expected.service && entry.service !== expected.service) return false;
  
  // Check context properties if provided
  if (expected.context) {
    const context = entry.context || {};
    for (const [key, value] of Object.entries(expected.context)) {
      if (context[key] !== value) return false;
    }
  }
  
  return true;
}

/**
 * Finds log entries in a transport that match expected criteria
 */
export function findLogEntries(transport: MockTransport, expected: Partial<LogEntry>): LogEntry[] {
  return transport.logs.filter(entry => verifyLogEntry(entry, expected));
}

/**
 * Sets up a test environment with a logger and cleans it up after the test
 */
export function withTestLogger(
  testFn: (logger: LoggerService, transport: MockTransport, formatter: MockFormatter) => Promise<void> | void,
  config?: TestLoggerConfig
): () => Promise<void> {
  return async () => {
    const { logger, mockTransport, mockFormatter } = await createTestLogger(config);
    try {
      await testFn(logger, mockTransport, mockFormatter);
    } finally {
      // Clean up
      mockTransport.reset();
      mockFormatter.reset();
    }
  };
}

/**
 * Resets all mocks and state between tests
 */
export function resetTestState(): void {
  jest.resetAllMocks();
  jest.clearAllMocks();
}

/**
 * Creates a spy logger that tracks all log method calls
 */
export function createSpyLogger(): {
  logger: LoggerService;
  spies: Record<string, jest.SpyInstance>;
} {
  const logger = new LoggerService();
  
  const spies = {
    log: jest.spyOn(logger, 'log').mockImplementation(),
    error: jest.spyOn(logger, 'error').mockImplementation(),
    warn: jest.spyOn(logger, 'warn').mockImplementation(),
    debug: jest.spyOn(logger, 'debug').mockImplementation(),
    verbose: jest.spyOn(logger, 'verbose').mockImplementation(),
  };
  
  return { logger, spies };
}

/**
 * Creates a test context manager with isolated state
 */
export function createTestContextManager(): ContextManager {
  return new ContextManager();
}

/**
 * Sets up a context for a test and cleans it up afterward
 */
export async function withContext<T>(
  contextManager: ContextManager,
  context: LoggingContext,
  fn: () => Promise<T> | T
): Promise<T> {
  return contextManager.run(context, fn);
}

/**
 * Utility to capture console output during tests
 */
export function captureConsoleOutput(): {
  output: string[];
  restore: () => void;
} {
  const output: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  console.log = (...args) => output.push(args.join(' '));
  console.error = (...args) => output.push(args.join(' '));
  console.warn = (...args) => output.push(args.join(' '));
  console.info = (...args) => output.push(args.join(' '));
  console.debug = (...args) => output.push(args.join(' '));
  
  return {
    output,
    restore: () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
      console.debug = originalConsoleDebug;
    },
  };
}

/**
 * Creates a test environment with isolated state for each test
 */
export function createTestEnvironment(): {
  cleanup: () => void;
  logger: LoggerService;
  transport: MockTransport;
  formatter: MockFormatter;
  contextManager: ContextManager;
} {
  const mockTransport = new MockTransport();
  const mockFormatter = new MockFormatter();
  const contextManager = createTestContextManager();
  const logger = new LoggerService();
  
  // Configure the logger with our test components
  (logger as any).transports = [mockTransport];
  (logger as any).formatter = mockFormatter;
  (logger as any).contextManager = contextManager;
  (logger as any).level = LogLevel.DEBUG;
  
  return {
    cleanup: () => {
      mockTransport.reset();
      mockFormatter.reset();
      resetTestState();
    },
    logger,
    transport: mockTransport,
    formatter: mockFormatter,
    contextManager,
  };
}

/**
 * Utility to wait for async operations to complete
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Creates a mock for the NestJS Logger class
 */
export function createNestLoggerMock() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
}