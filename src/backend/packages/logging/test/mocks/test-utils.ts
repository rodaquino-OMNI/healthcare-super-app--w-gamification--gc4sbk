/**
 * Test utilities for logging package tests.
 * 
 * This file provides utility functions for setting up and cleaning up test environments
 * for logging components. It includes helpers for creating mock contexts, configuring
 * test logging environments, and resetting state between tests.
 */

import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { Transport } from '../../src/interfaces/transport.interface';
import { Formatter } from '../../src/formatters/formatter.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { JourneyType } from '../../src/context/context.constants';

/**
 * Mock transport that captures logs for testing.
 */
export class MockTransport implements Transport {
  public logs: LogEntry[] = [];
  public initialized = false;
  public closed = false;
  public errorOnWrite = false;

  constructor(public readonly name: string = 'mock-transport') {}

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async write(entry: LogEntry): Promise<void> {
    if (this.errorOnWrite) {
      throw new Error('Mock transport write error');
    }
    this.logs.push({ ...entry });
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  reset(): void {
    this.logs = [];
    this.initialized = false;
    this.closed = false;
    this.errorOnWrite = false;
  }
}

/**
 * Mock formatter that captures format calls for testing.
 */
export class MockFormatter implements Formatter {
  public formatCalls: LogEntry[] = [];
  public returnValue: string = 'mock-formatted-log';
  public errorOnFormat = false;

  constructor(public readonly name: string = 'mock-formatter') {}

  format(entry: LogEntry): string {
    if (this.errorOnFormat) {
      throw new Error('Mock formatter error');
    }
    this.formatCalls.push({ ...entry });
    return this.returnValue;
  }

  reset(): void {
    this.formatCalls = [];
    this.returnValue = 'mock-formatted-log';
    this.errorOnFormat = false;
  }
}

/**
 * Default test logger configuration.
 */
export const createTestLoggerConfig = (overrides: Partial<LoggerConfig> = {}): LoggerConfig => {
  return {
    level: LogLevel.DEBUG,
    appName: 'test-app',
    environment: 'test',
    serviceName: 'test-service',
    enableConsoleTransport: true,
    enableFileTransport: false,
    enableCloudWatchTransport: false,
    useJsonFormatter: true,
    ...overrides
  };
};

/**
 * Creates a basic logging context for testing.
 */
export const createTestLoggingContext = (overrides: Partial<LoggingContext> = {}): LoggingContext => {
  return {
    correlationId: 'test-correlation-id',
    requestId: 'test-request-id',
    timestamp: new Date().toISOString(),
    appName: 'test-app',
    serviceName: 'test-service',
    environment: 'test',
    ...overrides
  };
};

/**
 * Creates a journey context for testing.
 */
export const createTestJourneyContext = (
  journeyType: JourneyType = JourneyType.HEALTH,
  overrides: Partial<JourneyContext> = {}
): JourneyContext => {
  return {
    ...createTestLoggingContext(),
    journeyType,
    journeyId: `test-journey-${journeyType.toLowerCase()}`,
    journeyState: {
      currentStep: 'test-step',
      progress: 50
    },
    ...overrides
  };
};

/**
 * Creates a user context for testing.
 */
export const createTestUserContext = (overrides: Partial<UserContext> = {}): UserContext => {
  return {
    ...createTestLoggingContext(),
    userId: 'test-user-id',
    isAuthenticated: true,
    roles: ['user'],
    permissions: ['read'],
    ...overrides
  };
};

/**
 * Creates a request context for testing.
 */
export const createTestRequestContext = (overrides: Partial<RequestContext> = {}): RequestContext => {
  return {
    ...createTestLoggingContext(),
    method: 'GET',
    url: '/test',
    path: '/test',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides
  };
};

/**
 * Creates a combined context with journey, user, and request information.
 */
export const createTestCombinedContext = (overrides: Partial<LoggingContext> = {}): LoggingContext => {
  return {
    ...createTestLoggingContext(),
    ...createTestJourneyContext(),
    ...createTestUserContext(),
    ...createTestRequestContext(),
    ...overrides
  };
};

/**
 * Creates a test log entry for testing formatters and transports.
 */
export const createTestLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => {
  return {
    level: LogLevel.INFO,
    message: 'Test log message',
    timestamp: new Date().toISOString(),
    context: createTestLoggingContext(),
    ...overrides
  };
};

/**
 * Creates a test error object with stack trace for testing error logging.
 */
export const createTestError = (message: string = 'Test error'): Error => {
  return new Error(message);
};

/**
 * Captures console output for testing console logging.
 */
export class ConsoleCaptor {
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    debug: typeof console.debug;
    info: typeof console.info;
  };

  public logs: string[] = [];
  public errors: string[] = [];
  public warnings: string[] = [];
  public debugs: string[] = [];
  public infos: string[] = [];

  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      info: console.info
    };
  }

  start(): void {
    console.log = (...args: any[]) => {
      this.logs.push(args.map(arg => String(arg)).join(' '));
    };
    console.error = (...args: any[]) => {
      this.errors.push(args.map(arg => String(arg)).join(' '));
    };
    console.warn = (...args: any[]) => {
      this.warnings.push(args.map(arg => String(arg)).join(' '));
    };
    console.debug = (...args: any[]) => {
      this.debugs.push(args.map(arg => String(arg)).join(' '));
    };
    console.info = (...args: any[]) => {
      this.infos.push(args.map(arg => String(arg)).join(' '));
    };
  }

  stop(): void {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
  }

  reset(): void {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
    this.debugs = [];
    this.infos = [];
  }
}

/**
 * Environment variable manager for testing.
 */
export class EnvVarManager {
  private originalEnvVars: Record<string, string | undefined> = {};
  private modifiedVars: string[] = [];

  set(name: string, value: string): void {
    if (!this.modifiedVars.includes(name)) {
      this.originalEnvVars[name] = process.env[name];
      this.modifiedVars.push(name);
    }
    process.env[name] = value;
  }

  unset(name: string): void {
    if (!this.modifiedVars.includes(name)) {
      this.originalEnvVars[name] = process.env[name];
      this.modifiedVars.push(name);
    }
    delete process.env[name];
  }

  restore(): void {
    this.modifiedVars.forEach(name => {
      if (this.originalEnvVars[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = this.originalEnvVars[name];
      }
    });
    this.modifiedVars = [];
    this.originalEnvVars = {};
  }
}

/**
 * Test setup and teardown utilities.
 */
export const setupLoggingTest = () => {
  const mockTransport = new MockTransport();
  const mockFormatter = new MockFormatter();
  const consoleCaptor = new ConsoleCaptor();
  const envVarManager = new EnvVarManager();

  // Start capturing console output
  consoleCaptor.start();

  return {
    mockTransport,
    mockFormatter,
    consoleCaptor,
    envVarManager,
    cleanup: () => {
      mockTransport.reset();
      mockFormatter.reset();
      consoleCaptor.stop();
      consoleCaptor.reset();
      envVarManager.restore();
    }
  };
};

/**
 * Validates that a log entry contains expected data.
 */
export const validateLogEntry = (
  entry: LogEntry,
  expected: {
    level?: LogLevel;
    message?: string;
    context?: Partial<LoggingContext>;
    error?: boolean;
  }
): boolean => {
  if (expected.level !== undefined && entry.level !== expected.level) {
    return false;
  }

  if (expected.message !== undefined && entry.message !== expected.message) {
    return false;
  }

  if (expected.error !== undefined) {
    if (expected.error && !entry.error) {
      return false;
    }
    if (!expected.error && entry.error) {
      return false;
    }
  }

  if (expected.context !== undefined) {
    const context = entry.context || {};
    for (const [key, value] of Object.entries(expected.context)) {
      if (context[key] !== value) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Finds log entries matching specific criteria.
 */
export const findLogEntries = (
  entries: LogEntry[],
  criteria: {
    level?: LogLevel;
    message?: string | RegExp;
    context?: Partial<LoggingContext>;
    error?: boolean;
  }
): LogEntry[] => {
  return entries.filter(entry => {
    if (criteria.level !== undefined && entry.level !== criteria.level) {
      return false;
    }

    if (criteria.message !== undefined) {
      if (criteria.message instanceof RegExp) {
        if (!criteria.message.test(entry.message)) {
          return false;
        }
      } else if (entry.message !== criteria.message) {
        return false;
      }
    }

    if (criteria.error !== undefined) {
      if (criteria.error && !entry.error) {
        return false;
      }
      if (!criteria.error && entry.error) {
        return false;
      }
    }

    if (criteria.context !== undefined) {
      const context = entry.context || {};
      for (const [key, value] of Object.entries(criteria.context)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Waits for a specific condition to be true, useful for async tests.
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 50
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
};

/**
 * Resets all global state related to logging.
 */
export const resetLoggingGlobalState = (): void => {
  // This function would reset any global state maintained by the logging system
  // For example, clearing singleton instances or resetting module-level variables
  // The actual implementation depends on the specific global state in the logging system
};