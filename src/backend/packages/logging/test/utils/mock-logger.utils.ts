/**
 * @file Mock Logger Utilities
 * @description Provides mock implementations of LoggerService for isolated unit testing.
 * Includes a fully-featured mock logger that tracks calls, captures arguments, and simulates
 * the real LoggerService without external dependencies.
 */

import { LoggerService } from '@nestjs/common';
import { Logger, LogContext } from '../../src/interfaces/logger.interface';
import { LogLevel, LogLevelUtils } from '../../src/interfaces/log-level.enum';
import { JourneyType, JourneyContext } from '../../src/interfaces/log-entry.interface';

/**
 * Interface for tracking method calls in the mock logger
 */
export interface LoggerMethodCall {
  /** The method that was called */
  method: string;
  /** The arguments passed to the method */
  args: any[];
  /** Timestamp when the method was called */
  timestamp: Date;
  /** The log level associated with the call (if applicable) */
  level?: LogLevel;
  /** The journey context associated with the call (if applicable) */
  journey?: JourneyContext;
}

/**
 * Options for configuring the MockLogger
 */
export interface MockLoggerOptions {
  /** The minimum log level to process (defaults to DEBUG) */
  minLevel?: LogLevel;
  /** Whether to throw errors when simulating failures (defaults to false) */
  throwErrors?: boolean;
  /** The service name to include in log entries */
  serviceName?: string;
  /** Initial context for the logger */
  initialContext?: LogContext;
}

/**
 * A comprehensive mock implementation of the Logger interface for testing.
 * Tracks all method calls and arguments, supports log level filtering,
 * and provides error simulation capabilities.
 */
export class MockLogger implements Logger {
  /** Tracks all method calls for verification in tests */
  public readonly calls: LoggerMethodCall[] = [];
  /** The current log level */
  private logLevel: LogLevel = LogLevel.DEBUG;
  /** Whether to throw errors when simulating failures */
  private throwErrors: boolean = false;
  /** The service name to include in log entries */
  private serviceName: string = 'MockService';
  /** Current context for the logger */
  private context: LogContext = {};

  /**
   * Creates a new MockLogger instance
   * @param options Configuration options for the mock logger
   */
  constructor(options?: MockLoggerOptions) {
    if (options) {
      if (options.minLevel !== undefined) {
        this.logLevel = options.minLevel;
      }
      if (options.throwErrors !== undefined) {
        this.throwErrors = options.throwErrors;
      }
      if (options.serviceName) {
        this.serviceName = options.serviceName;
      }
      if (options.initialContext) {
        this.context = { ...options.initialContext };
      }
    }
  }

  /**
   * Records a method call for later verification
   * @param method The name of the method called
   * @param args The arguments passed to the method
   * @param level Optional log level associated with the call
   * @param journey Optional journey context associated with the call
   */
  private recordCall(method: string, args: any[], level?: LogLevel, journey?: JourneyContext): void {
    this.calls.push({
      method,
      args,
      timestamp: new Date(),
      level,
      journey
    });
  }

  /**
   * Checks if a specific log level is enabled
   * @param level The log level to check
   * @returns True if the log level is enabled, false otherwise
   */
  public isLevelEnabled(level: LogLevel): boolean {
    this.recordCall('isLevelEnabled', [level]);
    return LogLevelUtils.isEnabled(level, this.logLevel);
  }

  /**
   * Gets the current log level of the logger
   * @returns The current log level
   */
  public getLogLevel(): LogLevel {
    this.recordCall('getLogLevel', []);
    return this.logLevel;
  }

  /**
   * Sets the log level of the logger
   * @param level The log level to set
   */
  public setLogLevel(level: LogLevel): void {
    this.recordCall('setLogLevel', [level]);
    this.logLevel = level;
  }

  /**
   * Creates a child logger with inherited configuration and additional context
   * @param context Additional context for the child logger
   * @returns A new MockLogger instance with the combined context
   */
  public createChildLogger(context: LogContext): Logger {
    this.recordCall('createChildLogger', [context]);
    const childLogger = new MockLogger({
      minLevel: this.logLevel,
      throwErrors: this.throwErrors,
      serviceName: this.serviceName,
      initialContext: { ...this.context, ...context }
    });
    return childLogger;
  }

  /**
   * Sets the context for subsequent log entries
   * @param context The context to set
   */
  public setContext(context: LogContext): void {
    this.recordCall('setContext', [context]);
    this.context = { ...context };
  }

  /**
   * Adds context to the current logger context
   * @param context Additional context to add
   */
  public addContext(context: LogContext): void {
    this.recordCall('addContext', [context]);
    this.context = { ...this.context, ...context };
  }

  /**
   * Clears the current context
   */
  public clearContext(): void {
    this.recordCall('clearContext', []);
    this.context = {};
  }

  /**
   * Gets the current context
   * @returns The current context
   */
  public getContext(): LogContext {
    this.recordCall('getContext', []);
    return { ...this.context };
  }

  /**
   * Logs a message with the DEBUG level
   * @param message The message to log
   * @param context Optional context for the log
   */
  public debug(message: string, context?: string | LogContext): void {
    this.recordCall('debug', [message, context], LogLevel.DEBUG);
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the INFO level
   * @param message The message to log
   * @param context Optional context for the log
   */
  public log(message: string, context?: string | LogContext): void {
    this.recordCall('log', [message, context], LogLevel.INFO);
    if (this.isLevelEnabled(LogLevel.INFO)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the INFO level (alias for log)
   * @param message The message to log
   * @param context Optional context for the log
   */
  public info(message: string, context?: string | LogContext): void {
    this.recordCall('info', [message, context], LogLevel.INFO);
    if (this.isLevelEnabled(LogLevel.INFO)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the WARN level
   * @param message The message to log
   * @param context Optional context for the log
   */
  public warn(message: string, context?: string | LogContext): void {
    this.recordCall('warn', [message, context], LogLevel.WARN);
    if (this.isLevelEnabled(LogLevel.WARN)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  public error(message: string, trace?: string | Error, context?: string | LogContext): void {
    this.recordCall('error', [message, trace, context], LogLevel.ERROR);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors) {
        throw new Error(`Mock error: ${message}`);
      }
    }
  }

  /**
   * Logs a message with the FATAL level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  public fatal(message: string, trace?: string | Error, context?: string | LogContext): void {
    this.recordCall('fatal', [message, trace, context], LogLevel.FATAL);
    if (this.isLevelEnabled(LogLevel.FATAL)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors) {
        throw new Error(`Mock fatal error: ${message}`);
      }
    }
  }

  /**
   * Logs a structured error with the ERROR level
   * @param error The error object or message
   * @param context Optional context for the log
   */
  public logError(error: Error | string, context?: string | LogContext): void {
    this.recordCall('logError', [error, context], LogLevel.ERROR);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the error in a real logger
      if (this.throwErrors) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Mock error: ${error}`);
        }
      }
    }
  }

  /**
   * Logs a structured error with the FATAL level
   * @param error The error object or message
   * @param context Optional context for the log
   */
  public logFatal(error: Error | string, context?: string | LogContext): void {
    this.recordCall('logFatal', [error, context], LogLevel.FATAL);
    if (this.isLevelEnabled(LogLevel.FATAL)) {
      // Implementation would log the error in a real logger
      if (this.throwErrors) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Mock fatal error: ${error}`);
        }
      }
    }
  }

  /**
   * Logs a message with the DEBUG level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  public debugHealth(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.HEALTH, resourceId };
    this.recordCall('debugHealth', [message, resourceId, context], LogLevel.DEBUG, journey);
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the INFO level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  public logHealth(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.HEALTH, resourceId };
    this.recordCall('logHealth', [message, resourceId, context], LogLevel.INFO, journey);
    if (this.isLevelEnabled(LogLevel.INFO)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the WARN level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  public warnHealth(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.HEALTH, resourceId };
    this.recordCall('warnHealth', [message, resourceId, context], LogLevel.WARN, journey);
    if (this.isLevelEnabled(LogLevel.WARN)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the ERROR level in the Health journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  public errorHealth(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.HEALTH, resourceId };
    this.recordCall('errorHealth', [message, trace, resourceId, context], LogLevel.ERROR, journey);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors) {
        throw new Error(`Mock health error: ${message}`);
      }
    }
  }

  /**
   * Logs a structured error with the ERROR level in the Health journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  public logErrorHealth(error: Error | string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.HEALTH, resourceId };
    this.recordCall('logErrorHealth', [error, resourceId, context], LogLevel.ERROR, journey);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the error in a real logger
      if (this.throwErrors) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Mock health error: ${error}`);
        }
      }
    }
  }

  /**
   * Logs a message with the DEBUG level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  public debugCare(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.CARE, resourceId };
    this.recordCall('debugCare', [message, resourceId, context], LogLevel.DEBUG, journey);
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the INFO level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  public logCare(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.CARE, resourceId };
    this.recordCall('logCare', [message, resourceId, context], LogLevel.INFO, journey);
    if (this.isLevelEnabled(LogLevel.INFO)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the WARN level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  public warnCare(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.CARE, resourceId };
    this.recordCall('warnCare', [message, resourceId, context], LogLevel.WARN, journey);
    if (this.isLevelEnabled(LogLevel.WARN)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the ERROR level in the Care journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  public errorCare(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.CARE, resourceId };
    this.recordCall('errorCare', [message, trace, resourceId, context], LogLevel.ERROR, journey);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors) {
        throw new Error(`Mock care error: ${message}`);
      }
    }
  }

  /**
   * Logs a structured error with the ERROR level in the Care journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  public logErrorCare(error: Error | string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.CARE, resourceId };
    this.recordCall('logErrorCare', [error, resourceId, context], LogLevel.ERROR, journey);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the error in a real logger
      if (this.throwErrors) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Mock care error: ${error}`);
        }
      }
    }
  }

  /**
   * Logs a message with the DEBUG level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  public debugPlan(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.PLAN, resourceId };
    this.recordCall('debugPlan', [message, resourceId, context], LogLevel.DEBUG, journey);
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the INFO level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  public logPlan(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.PLAN, resourceId };
    this.recordCall('logPlan', [message, resourceId, context], LogLevel.INFO, journey);
    if (this.isLevelEnabled(LogLevel.INFO)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the WARN level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  public warnPlan(message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.PLAN, resourceId };
    this.recordCall('warnPlan', [message, resourceId, context], LogLevel.WARN, journey);
    if (this.isLevelEnabled(LogLevel.WARN)) {
      // Implementation would log the message in a real logger
    }
  }

  /**
   * Logs a message with the ERROR level in the Plan journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  public errorPlan(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.PLAN, resourceId };
    this.recordCall('errorPlan', [message, trace, resourceId, context], LogLevel.ERROR, journey);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors) {
        throw new Error(`Mock plan error: ${message}`);
      }
    }
  }

  /**
   * Logs a structured error with the ERROR level in the Plan journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  public logErrorPlan(error: Error | string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { type: JourneyType.PLAN, resourceId };
    this.recordCall('logErrorPlan', [error, resourceId, context], LogLevel.ERROR, journey);
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Implementation would log the error in a real logger
      if (this.throwErrors) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Mock plan error: ${error}`);
        }
      }
    }
  }

  /**
   * Logs a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context for the log
   */
  public logWithLevel(level: LogLevel, message: string, context?: string | LogContext): void {
    this.recordCall('logWithLevel', [level, message, context], level);
    if (this.isLevelEnabled(level)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
        throw new Error(`Mock error (${LogLevelUtils.toString(level)}): ${message}`);
      }
    }
  }

  /**
   * Logs a message with the specified level and journey context
   * @param level The log level
   * @param journeyType The journey type
   * @param message The message to log
   * @param resourceId Optional resource ID within the journey
   * @param context Optional additional context for the log
   */
  public logWithJourney(level: LogLevel, journeyType: 'health' | 'care' | 'plan', message: string, resourceId?: string, context?: string | LogContext): void {
    const journey: JourneyContext = { 
      type: journeyType === 'health' ? JourneyType.HEALTH : 
            journeyType === 'care' ? JourneyType.CARE : JourneyType.PLAN, 
      resourceId 
    };
    this.recordCall('logWithJourney', [level, journeyType, message, resourceId, context], level, journey);
    if (this.isLevelEnabled(level)) {
      // Implementation would log the message in a real logger
      if (this.throwErrors && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
        throw new Error(`Mock ${journeyType} error (${LogLevelUtils.toString(level)}): ${message}`);
      }
    }
  }

  /**
   * Starts a timer and returns a function that, when called, logs the elapsed time
   * @param label Label for the timer
   * @param level Log level to use when logging the elapsed time (defaults to INFO)
   * @param context Optional context for the log
   * @returns A function that, when called, logs the elapsed time
   */
  public startTimer(label: string, level: LogLevel = LogLevel.INFO, context?: string | LogContext): () => void {
    this.recordCall('startTimer', [label, level, context]);
    const startTime = Date.now();
    return () => {
      const elapsed = Date.now() - startTime;
      this.logWithLevel(level, `${label}: ${elapsed}ms`, context);
    };
  }

  /**
   * Logs the start of an operation and returns a function that, when called, logs the end of the operation
   * @param operation Name of the operation
   * @param context Optional context for the log
   * @returns A function that, when called, logs the end of the operation
   */
  public logOperation(operation: string, context?: string | LogContext): (result?: string) => void {
    this.recordCall('logOperation', [operation, context]);
    this.log(`Starting operation: ${operation}`, context);
    const startTime = Date.now();
    return (result?: string) => {
      const elapsed = Date.now() - startTime;
      this.log(`Completed operation: ${operation}${result ? ` (${result})` : ''} in ${elapsed}ms`, context);
    };
  }

  /**
   * Logs the start of an operation in the specified journey context and returns a function that, when called, logs the end of the operation
   * @param journeyType The journey type
   * @param operation Name of the operation
   * @param resourceId Optional resource ID within the journey
   * @param context Optional additional context for the log
   * @returns A function that, when called, logs the end of the operation
   */
  public logJourneyOperation(journeyType: 'health' | 'care' | 'plan', operation: string, resourceId?: string, context?: string | LogContext): (result?: string) => void {
    this.recordCall('logJourneyOperation', [journeyType, operation, resourceId, context]);
    this.logWithJourney(LogLevel.INFO, journeyType, `Starting operation: ${operation}`, resourceId, context);
    const startTime = Date.now();
    return (result?: string) => {
      const elapsed = Date.now() - startTime;
      this.logWithJourney(
        LogLevel.INFO, 
        journeyType, 
        `Completed operation: ${operation}${result ? ` (${result})` : ''} in ${elapsed}ms`, 
        resourceId, 
        context
      );
    };
  }

  /**
   * Flushes any buffered log entries
   * @returns A promise that resolves when all buffered entries have been written
   */
  public async flush(): Promise<void> {
    this.recordCall('flush', []);
    // In a real implementation, this would flush buffered logs
    return Promise.resolve();
  }

  /**
   * Utility method to get all calls to a specific method
   * @param methodName The name of the method to filter by
   * @returns An array of method calls matching the method name
   */
  public getCallsToMethod(methodName: string): LoggerMethodCall[] {
    return this.calls.filter(call => call.method === methodName);
  }

  /**
   * Utility method to get all calls with a specific log level
   * @param level The log level to filter by
   * @returns An array of method calls matching the log level
   */
  public getCallsWithLevel(level: LogLevel): LoggerMethodCall[] {
    return this.calls.filter(call => call.level === level);
  }

  /**
   * Utility method to get all calls with a specific journey type
   * @param journeyType The journey type to filter by
   * @returns An array of method calls matching the journey type
   */
  public getCallsWithJourney(journeyType: JourneyType): LoggerMethodCall[] {
    return this.calls.filter(call => call.journey?.type === journeyType);
  }

  /**
   * Utility method to clear all recorded calls
   */
  public clearCalls(): void {
    this.calls.length = 0;
  }

  /**
   * Creates a simple mock logger that implements the NestJS LoggerService interface
   * @returns A simple mock logger
   */
  public static createSimpleMock(): LoggerService {
    return {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };
  }

  /**
   * Creates a spy on an existing logger
   * @param logger The logger to spy on
   * @returns The same logger with all methods wrapped in Jest spies
   */
  public static createLoggerSpy(logger: Logger): Logger {
    // Create a proxy that wraps all methods with Jest spies
    return new Proxy(logger, {
      get(target, prop) {
        const value = target[prop as keyof Logger];
        if (typeof value === 'function') {
          // If the property is a function, wrap it with a Jest spy
          if (!jest.isMockFunction(value)) {
            target[prop as keyof Logger] = jest.fn(value.bind(target)) as any;
          }
        }
        return target[prop as keyof Logger];
      }
    });
  }

  /**
   * Utility method to create a mock logger with error simulation enabled
   * @param options Additional options for the mock logger
   * @returns A mock logger configured to throw errors
   */
  public static createErrorSimulator(options?: Omit<MockLoggerOptions, 'throwErrors'>): MockLogger {
    return new MockLogger({
      ...options,
      throwErrors: true
    });
  }
}

/**
 * A simplified mock logger for basic testing scenarios
 * Implements only the core NestJS LoggerService interface
 */
export class SimpleLoggerMock implements LoggerService {
  public readonly logs: { level: string; message: string; context?: any }[] = [];

  log(message: string, context?: any): void {
    this.logs.push({ level: 'info', message, context });
  }

  error(message: string, trace?: any, context?: any): void {
    this.logs.push({ level: 'error', message, context });
  }

  warn(message: string, context?: any): void {
    this.logs.push({ level: 'warn', message, context });
  }

  debug(message: string, context?: any): void {
    this.logs.push({ level: 'debug', message, context });
  }

  verbose(message: string, context?: any): void {
    this.logs.push({ level: 'verbose', message, context });
  }

  /**
   * Clears all recorded logs
   */
  clear(): void {
    this.logs.length = 0;
  }

  /**
   * Gets logs of a specific level
   * @param level The log level to filter by
   * @returns An array of logs matching the level
   */
  getLogsByLevel(level: string): { level: string; message: string; context?: any }[] {
    return this.logs.filter(log => log.level === level);
  }
}