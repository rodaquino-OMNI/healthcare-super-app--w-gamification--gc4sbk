import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../src/logger.module';
import { LoggerService } from '../../src/logger.service';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { JourneyType } from '../../src/context/context.constants';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { ContextManager } from '../../src/context/context-manager';

import {
  MockTransport,
  MockFormatter,
  MockConfigService,
  MockTracingService,
} from '../mocks';

import {
  journeyData,
  logContexts,
  logEntries,
  errorObjects,
  configOptions,
} from '../fixtures';

/**
 * A memory transport that captures logs for testing.
 * This transport stores all log entries in memory for later inspection.
 */
export class MemoryTransport implements Transport {
  public logs: LogEntry[] = [];
  private formatter: Formatter;
  private initialized = false;

  constructor(formatter?: Formatter) {
    this.formatter = formatter || new MockFormatter();
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      throw new Error('Transport not initialized');
    }
    this.logs.push({ ...entry });
    return Promise.resolve();
  }

  async close(): Promise<void> {
    this.initialized = false;
    return Promise.resolve();
  }

  reset(): void {
    this.logs = [];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByMessage(messageSubstring: string): LogEntry[] {
    return this.logs.filter(log => 
      log.message && log.message.includes(messageSubstring)
    );
  }

  getLogsByContext(contextMatcher: Partial<LoggingContext>): LogEntry[] {
    return this.logs.filter(log => {
      if (!log.context) return false;
      
      return Object.entries(contextMatcher).every(([key, value]) => {
        return log.context && log.context[key] === value;
      });
    });
  }

  getLastLog(): LogEntry | undefined {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : undefined;
  }
}

/**
 * Creates a test module with LoggerModule configured for testing.
 * @param config Optional logger configuration
 * @returns A promise that resolves to the test module
 */
export async function createTestingModule(
  config?: Partial<LoggerConfig>
): Promise<TestingModule> {
  const memoryTransport = new MemoryTransport();
  
  const mockConfigService = new MockConfigService({
    logger: {
      level: LogLevel.DEBUG,
      ...config,
    },
  });

  const mockTracingService = new MockTracingService();

  return Test.createTestingModule({
    imports: [
      LoggerModule.forRoot({
        level: LogLevel.DEBUG,
        transports: [memoryTransport],
        ...config,
      }),
    ],
    providers: [
      {
        provide: 'CONFIG_SERVICE',
        useValue: mockConfigService,
      },
      {
        provide: 'TRACING_SERVICE',
        useValue: mockTracingService,
      },
    ],
  }).compile();
}

/**
 * Creates a test module with LoggerModule and returns the LoggerService and MemoryTransport.
 * @param config Optional logger configuration
 * @returns A promise that resolves to an object containing the LoggerService and MemoryTransport
 */
export async function createTestLogger(
  config?: Partial<LoggerConfig>
): Promise<{ logger: LoggerService; transport: MemoryTransport }> {
  const memoryTransport = new MemoryTransport();
  
  const module = await Test.createTestingModule({
    imports: [
      LoggerModule.forRoot({
        level: LogLevel.DEBUG,
        transports: [memoryTransport],
        ...config,
      }),
    ],
    providers: [
      {
        provide: 'CONFIG_SERVICE',
        useValue: new MockConfigService({
          logger: {
            level: LogLevel.DEBUG,
            ...config,
          },
        }),
      },
      {
        provide: 'TRACING_SERVICE',
        useValue: new MockTracingService(),
      },
    ],
  }).compile();

  const logger = module.get<LoggerService>(LoggerService);

  return { logger, transport: memoryTransport };
}

/**
 * Creates a journey context for testing.
 * @param journeyType The type of journey
 * @param additionalContext Additional context properties
 * @returns A journey context object
 */
export function createJourneyContext(
  journeyType: JourneyType,
  additionalContext: Partial<JourneyContext> = {}
): JourneyContext {
  return {
    journeyId: `test-journey-${Date.now()}`,
    journeyType,
    correlationId: `test-correlation-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Creates a request context for testing.
 * @param additionalContext Additional context properties
 * @returns A request context object
 */
export function createRequestContext(
  additionalContext: Partial<RequestContext> = {}
): RequestContext {
  return {
    requestId: `test-request-${Date.now()}`,
    method: 'GET',
    url: '/test',
    ip: '127.0.0.1',
    userAgent: 'Test Agent',
    correlationId: `test-correlation-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Creates a user context for testing.
 * @param additionalContext Additional context properties
 * @returns A user context object
 */
export function createUserContext(
  additionalContext: Partial<UserContext> = {}
): UserContext {
  return {
    userId: `test-user-${Date.now()}`,
    isAuthenticated: true,
    roles: ['user'],
    correlationId: `test-correlation-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Creates a combined context with journey, request, and user information.
 * @param journeyType The type of journey
 * @returns A combined context object
 */
export function createCombinedContext(journeyType: JourneyType): LoggingContext {
  const correlationId = `test-correlation-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  return {
    journeyId: `test-journey-${Date.now()}`,
    journeyType,
    requestId: `test-request-${Date.now()}`,
    method: 'GET',
    url: '/test',
    ip: '127.0.0.1',
    userAgent: 'Test Agent',
    userId: `test-user-${Date.now()}`,
    isAuthenticated: true,
    roles: ['user'],
    correlationId,
    timestamp,
  };
}

/**
 * Assertion helper for verifying log entries.
 * @param log The log entry to verify
 * @param expected Expected properties of the log entry
 */
export function assertLogEntry(
  log: LogEntry,
  expected: Partial<LogEntry>
): void {
  if (expected.level !== undefined) {
    expect(log.level).toBe(expected.level);
  }
  
  if (expected.message !== undefined) {
    expect(log.message).toBe(expected.message);
  }
  
  if (expected.context !== undefined) {
    Object.entries(expected.context).forEach(([key, value]) => {
      expect(log.context?.[key]).toBe(value);
    });
  }
  
  if (expected.error !== undefined) {
    expect(log.error).toBeDefined();
    if (typeof expected.error === 'string') {
      expect(log.error.message).toBe(expected.error);
    } else {
      expect(log.error.message).toBe(expected.error.message);
    }
  }
}

/**
 * Waits for a specific log to appear in the transport.
 * @param transport The memory transport to check
 * @param predicate A function that returns true when the desired log is found
 * @param timeout Maximum time to wait in milliseconds
 * @returns A promise that resolves to the matching log entry or rejects if timeout is reached
 */
export async function waitForLog(
  transport: MemoryTransport,
  predicate: (log: LogEntry) => boolean,
  timeout = 1000
): Promise<LogEntry> {
  const startTime = Date.now();
  
  return new Promise<LogEntry>((resolve, reject) => {
    const checkLogs = () => {
      const log = transport.logs.find(predicate);
      
      if (log) {
        resolve(log);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for log: ${timeout}ms`));
        return;
      }
      
      setTimeout(checkLogs, 10);
    };
    
    checkLogs();
  });
}

/**
 * Creates a context manager with preset contexts for testing.
 * @param contexts Contexts to preset in the manager
 * @returns A context manager instance
 */
export function createContextManager(
  contexts: Partial<{
    journey: JourneyContext;
    request: RequestContext;
    user: UserContext;
  }> = {}
): ContextManager {
  const contextManager = new ContextManager();
  
  if (contexts.journey) {
    contextManager.setJourneyContext(contexts.journey);
  }
  
  if (contexts.request) {
    contextManager.setRequestContext(contexts.request);
  }
  
  if (contexts.user) {
    contextManager.setUserContext(contexts.user);
  }
  
  return contextManager;
}

/**
 * Utility to capture console output during tests.
 * @returns An object with methods to start and stop capturing, and get the captured output
 */
export function createConsoleCapturer() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
    info: console.info,
  };
  
  let captured = {
    log: [] as string[],
    error: [] as string[],
    warn: [] as string[],
    debug: [] as string[],
    info: [] as string[],
  };
  
  return {
    start() {
      console.log = (...args: any[]) => {
        captured.log.push(args.map(arg => String(arg)).join(' '));
      };
      
      console.error = (...args: any[]) => {
        captured.error.push(args.map(arg => String(arg)).join(' '));
      };
      
      console.warn = (...args: any[]) => {
        captured.warn.push(args.map(arg => String(arg)).join(' '));
      };
      
      console.debug = (...args: any[]) => {
        captured.debug.push(args.map(arg => String(arg)).join(' '));
      };
      
      console.info = (...args: any[]) => {
        captured.info.push(args.map(arg => String(arg)).join(' '));
      };
    },
    
    stop() {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
    },
    
    getOutput() {
      return captured;
    },
    
    reset() {
      captured = {
        log: [],
        error: [],
        warn: [],
        debug: [],
        info: [],
      };
    },
  };
}

/**
 * Creates a file system mock for testing file transports.
 * @returns A mock file system object
 */
export function createFilesystemMock() {
  const files: Record<string, string> = {};
  
  return {
    writeFile(path: string, data: string): Promise<void> {
      files[path] = data;
      return Promise.resolve();
    },
    
    readFile(path: string): Promise<string> {
      if (!files[path]) {
        return Promise.reject(new Error(`File not found: ${path}`));
      }
      return Promise.resolve(files[path]);
    },
    
    exists(path: string): Promise<boolean> {
      return Promise.resolve(path in files);
    },
    
    getFiles(): Record<string, string> {
      return { ...files };
    },
    
    reset(): void {
      Object.keys(files).forEach(key => {
        delete files[key];
      });
    },
  };
}

/**
 * Creates a mock AWS CloudWatch client for testing CloudWatch transport.
 * @returns A mock CloudWatch client
 */
export function createCloudWatchMock() {
  const logGroups: Record<string, any> = {};
  const logStreams: Record<string, any> = {};
  const logEvents: Record<string, any[]> = {};
  
  return {
    createLogGroup(params: { logGroupName: string }): Promise<void> {
      logGroups[params.logGroupName] = { created: new Date() };
      return Promise.resolve();
    },
    
    createLogStream(params: { logGroupName: string; logStreamName: string }): Promise<void> {
      const key = `${params.logGroupName}:${params.logStreamName}`;
      logStreams[key] = { created: new Date() };
      logEvents[key] = [];
      return Promise.resolve();
    },
    
    putLogEvents(params: { 
      logGroupName: string; 
      logStreamName: string; 
      logEvents: Array<{ message: string; timestamp: number }> 
    }): Promise<{ nextSequenceToken: string }> {
      const key = `${params.logGroupName}:${params.logStreamName}`;
      
      if (!logStreams[key]) {
        return Promise.reject(new Error(`Log stream not found: ${key}`));
      }
      
      logEvents[key] = [...logEvents[key], ...params.logEvents];
      
      return Promise.resolve({
        nextSequenceToken: `token-${Date.now()}`,
      });
    },
    
    getLogEvents(params: { logGroupName: string; logStreamName: string }): Promise<{ events: any[] }> {
      const key = `${params.logGroupName}:${params.logStreamName}`;
      
      if (!logStreams[key]) {
        return Promise.reject(new Error(`Log stream not found: ${key}`));
      }
      
      return Promise.resolve({
        events: logEvents[key] || [],
      });
    },
    
    reset(): void {
      Object.keys(logGroups).forEach(key => {
        delete logGroups[key];
      });
      
      Object.keys(logStreams).forEach(key => {
        delete logStreams[key];
      });
      
      Object.keys(logEvents).forEach(key => {
        delete logEvents[key];
      });
    },
  };
}

/**
 * Utility to create a test error with a predictable stack trace.
 * @param message Error message
 * @param additionalProperties Additional properties to add to the error
 * @returns An Error object with the specified properties
 */
export function createTestError(
  message: string,
  additionalProperties: Record<string, any> = {}
): Error {
  const error = new Error(message);
  
  Object.entries(additionalProperties).forEach(([key, value]) => {
    (error as any)[key] = value;
  });
  
  return error;
}

/**
 * Utility to create a test validation error with field-specific details.
 * @param message Overall error message
 * @param fieldErrors Map of field names to error messages
 * @returns A validation error object
 */
export function createValidationError(
  message: string,
  fieldErrors: Record<string, string[]>
): Error {
  const error = new Error(message);
  (error as any).name = 'ValidationError';
  (error as any).fieldErrors = fieldErrors;
  
  return error;
}

/**
 * Utility to create a test business error with a specific error code.
 * @param message Error message
 * @param code Error code
 * @param additionalProperties Additional properties to add to the error
 * @returns A business error object
 */
export function createBusinessError(
  message: string,
  code: string,
  additionalProperties: Record<string, any> = {}
): Error {
  const error = new Error(message);
  (error as any).name = 'BusinessError';
  (error as any).code = code;
  
  Object.entries(additionalProperties).forEach(([key, value]) => {
    (error as any)[key] = value;
  });
  
  return error;
}

/**
 * Utility to create a test external dependency error.
 * @param message Error message
 * @param service Name of the external service
 * @param originalError Original error from the external service
 * @returns An external dependency error object
 */
export function createExternalError(
  message: string,
  service: string,
  originalError?: Error
): Error {
  const error = new Error(message);
  (error as any).name = 'ExternalDependencyError';
  (error as any).service = service;
  
  if (originalError) {
    (error as any).cause = originalError;
  }
  
  return error;
}

/**
 * Utility to create a test database error.
 * @param message Error message
 * @param code Database error code
 * @param query The query that caused the error
 * @returns A database error object
 */
export function createDatabaseError(
  message: string,
  code: string,
  query?: string
): Error {
  const error = new Error(message);
  (error as any).name = 'DatabaseError';
  (error as any).code = code;
  
  if (query) {
    (error as any).query = query;
  }
  
  return error;
}

/**
 * Utility to create a test timeout error.
 * @param message Error message
 * @param timeoutMs Timeout in milliseconds
 * @param operation The operation that timed out
 * @returns A timeout error object
 */
export function createTimeoutError(
  message: string,
  timeoutMs: number,
  operation: string
): Error {
  const error = new Error(message);
  (error as any).name = 'TimeoutError';
  (error as any).timeoutMs = timeoutMs;
  (error as any).operation = operation;
  
  return error;
}

/**
 * Exports all fixtures for convenience in tests.
 */
export { journeyData, logContexts, logEntries, errorObjects, configOptions };