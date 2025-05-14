import { LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Interface representing a logged message with its metadata.
 * Used for tracking and analyzing log calls in tests.
 */
export interface LoggedMessage {
  /** The log level of the message */
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  /** The actual message text */
  message: string;
  /** Optional context object provided with the log */
  context?: any;
  /** Optional stack trace or error object (for error logs) */
  trace?: any;
  /** Timestamp when the message was logged */
  timestamp: Date;
  /** Optional journey context for journey-specific logging */
  journeyContext?: 'health' | 'care' | 'plan' | string;
}

/**
 * Configuration options for the MockLoggerService.
 * Allows customization of the mock logger behavior for different testing scenarios.
 */
export interface MockLoggerOptions {
  /** Minimum log level to record (defaults to 'verbose' which records everything) */
  minLevel?: 'verbose' | 'debug' | 'log' | 'warn' | 'error';
  /** Whether to simulate errors during logging operations (for testing error handling) */
  simulateErrors?: boolean;
  /** Default journey context to apply to all logs if not specified in the context */
  defaultJourneyContext?: 'health' | 'care' | 'plan' | string;
  /** Whether to include timestamps in the logged messages (defaults to true) */
  includeTimestamps?: boolean;
}

/**
 * Mock implementation of LoggerService for testing purposes.
 * Provides tracking of log calls, arguments, and simulates the real LoggerService
 * without external dependencies. Essential for testing components that depend on
 * LoggerService without requiring the actual logging implementation.
 */
export class MockLoggerService implements NestLoggerService {
  /** Collection of all logged messages */
  private messages: LoggedMessage[] = [];
  /** Configuration options for this mock logger instance */
  private options: MockLoggerOptions;
  /** Log levels in order of increasing severity */
  private readonly logLevels = ['verbose', 'debug', 'log', 'warn', 'error'];

  /**
   * Creates a new instance of MockLoggerService
   * @param options Configuration options for the mock logger
   */
  constructor(options: MockLoggerOptions = {}) {
    this.options = {
      minLevel: 'verbose',
      simulateErrors: false,
      defaultJourneyContext: undefined,
      includeTimestamps: true,
      ...options,
    };
  }

  /**
   * Logs a message with the INFO level
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: any): void {
    this.addMessage('log', message, context);
  }

  /**
   * Logs a message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: any, context?: any): void {
    this.addMessage('error', message, context, trace);
  }

  /**
   * Logs a message with the WARN level
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: any): void {
    this.addMessage('warn', message, context);
  }

  /**
   * Logs a message with the DEBUG level
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: any): void {
    this.addMessage('debug', message, context);
  }

  /**
   * Logs a message with the VERBOSE level
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: any): void {
    this.addMessage('verbose', message, context);
  }

  /**
   * Retrieves all logged messages
   * @returns Array of logged messages
   */
  getMessages(): LoggedMessage[] {
    return [...this.messages];
  }

  /**
   * Retrieves messages filtered by log level
   * @param level The log level to filter by
   * @returns Array of messages with the specified log level
   */
  getMessagesByLevel(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose'): LoggedMessage[] {
    return this.messages.filter(msg => msg.level === level);
  }

  /**
   * Retrieves messages filtered by journey context
   * @param journeyContext The journey context to filter by
   * @returns Array of messages with the specified journey context
   */
  getMessagesByJourneyContext(journeyContext: string): LoggedMessage[] {
    return this.messages.filter(msg => msg.journeyContext === journeyContext);
  }
  
  /**
   * Retrieves messages filtered by both level and journey context
   * @param level The log level to filter by
   * @param journeyContext The journey context to filter by
   * @returns Array of messages matching both criteria
   */
  getMessagesByLevelAndJourney(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
    journeyContext: string
  ): LoggedMessage[] {
    return this.messages.filter(
      msg => msg.level === level && msg.journeyContext === journeyContext
    );
  }

  /**
   * Retrieves messages containing the specified text
   * @param text The text to search for in messages
   * @returns Array of messages containing the specified text
   */
  getMessagesByText(text: string): LoggedMessage[] {
    return this.messages.filter(msg => msg.message.includes(text));
  }

  /**
   * Checks if a message with the specified level and text exists
   * @param level The log level to check for
   * @param text The text to search for in messages
   * @returns True if a matching message exists, false otherwise
   */
  hasMessage(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose', text: string): boolean {
    return this.messages.some(msg => msg.level === level && msg.message.includes(text));
  }
  
  /**
   * Checks if a message with the specified level, text, and journey context exists
   * @param level The log level to check for
   * @param text The text to search for in messages
   * @param journeyContext The journey context to check for
   * @returns True if a matching message exists, false otherwise
   */
  hasJourneyMessage(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose', 
    text: string, 
    journeyContext: string
  ): boolean {
    return this.messages.some(
      msg => msg.level === level && 
             msg.message.includes(text) && 
             msg.journeyContext === journeyContext
    );
  }

  /**
   * Clears all logged messages
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Updates the logger options
   * @param options New options to apply
   */
  updateOptions(options: Partial<MockLoggerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }
  
  /**
   * Gets the current count of messages by level
   * @returns An object with counts for each log level
   */
  getMessageCounts(): Record<'log' | 'error' | 'warn' | 'debug' | 'verbose', number> {
    const counts = {
      log: 0,
      error: 0,
      warn: 0,
      debug: 0,
      verbose: 0
    };
    
    this.messages.forEach(msg => {
      counts[msg.level]++;
    });
    
    return counts;
  }
  
  /**
   * Gets the last logged message
   * @returns The most recent logged message or undefined if none exist
   */
  getLastMessage(): LoggedMessage | undefined {
    if (this.messages.length === 0) {
      return undefined;
    }
    return this.messages[this.messages.length - 1];
  }

  /**
   * Sets the journey context for subsequent log messages
   * @param journeyContext The journey context to set
   */
  setJourneyContext(journeyContext: 'health' | 'care' | 'plan' | string): void {
    this.options.defaultJourneyContext = journeyContext;
  }

  /**
   * Adds a message to the log if it meets the minimum level requirement
   * @param level The log level
   * @param message The message text
   * @param context Optional context
   * @param trace Optional trace information
   */
  private addMessage(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose', message: string, context?: any, trace?: any): void {
    // Check if we should log this message based on minimum level
    if (!this.shouldLogLevel(level)) {
      return;
    }

    // Simulate errors if configured
    if (this.options.simulateErrors) {
      throw new Error(`Simulated error during ${level} operation`);
    }

    // Extract journey context from the provided context or use default
    let journeyContext = this.options.defaultJourneyContext;
    if (context && typeof context === 'object' && 'journeyContext' in context) {
      journeyContext = context.journeyContext;
    }

    // Process context to handle special cases
    let processedContext = context;
    if (context && typeof context === 'object') {
      // Create a shallow copy to avoid modifying the original
      processedContext = { ...context };
      
      // Handle error objects in context
      if (processedContext.error instanceof Error) {
        processedContext.errorMessage = processedContext.error.message;
        processedContext.errorStack = processedContext.error.stack;
      }
    }

    // Add the message to our collection
    this.messages.push({
      level,
      message,
      context: processedContext,
      trace,
      timestamp: this.options.includeTimestamps ? new Date() : undefined,
      journeyContext,
    });
  }

  /**
   * Determines if a message with the given level should be logged
   * based on the configured minimum level
   * @param level The log level to check
   * @returns True if the message should be logged, false otherwise
   */
  private shouldLogLevel(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose'): boolean {
    const minLevelIndex = this.logLevels.indexOf(this.options.minLevel);
    const currentLevelIndex = this.logLevels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }
}

/**
 * Creates a new MockLoggerService with default options.
 * Convenience function for quickly creating a mock logger in tests.
 * 
 * @param options Configuration options for the mock logger
 * @returns A configured MockLoggerService instance
 * 
 * @example
 * // Basic usage
 * const logger = createMockLogger();
 * 
 * @example
 * // With custom options
 * const logger = createMockLogger({
 *   minLevel: 'warn',
 *   defaultJourneyContext: 'health'
 * });
 */
export function createMockLogger(options: MockLoggerOptions = {}): MockLoggerService {
  return new MockLoggerService(options);
}

/**
 * Creates a journey-specific mock logger.
 * Convenience function for creating a mock logger with a specific journey context.
 * 
 * @param journeyContext The journey context to use ('health', 'care', or 'plan')
 * @param options Additional configuration options
 * @returns A configured MockLoggerService instance with the specified journey context
 * 
 * @example
 * const healthLogger = createJourneyMockLogger('health');
 * const careLogger = createJourneyMockLogger('care', { minLevel: 'warn' });
 */
export function createJourneyMockLogger(
  journeyContext: 'health' | 'care' | 'plan',
  options: Omit<MockLoggerOptions, 'defaultJourneyContext'> = {}
): MockLoggerService {
  return new MockLoggerService({
    ...options,
    defaultJourneyContext: journeyContext,
  });
}

/**
 * Creates a spy wrapper around an existing logger service.
 * This allows tests to both verify logging behavior and maintain actual logging.
 * 
 * @param realLogger The actual logger service to wrap
 * @param options Optional configuration for the mock logger behavior
 * @returns A MockLoggerService that forwards calls to the real logger
 */
export function createLoggerSpy(
  realLogger: NestLoggerService, 
  options: MockLoggerOptions = {}
): MockLoggerService & NestLoggerService {
  const mockLogger = new MockLoggerService(options);
  
  // Create a proxy that records the call and forwards to the real logger
  return new Proxy(mockLogger, {
    get(target, prop, receiver) {
      const originalMethod = Reflect.get(target, prop, receiver);
      
      if (typeof originalMethod === 'function' && ['log', 'error', 'warn', 'debug', 'verbose'].includes(prop as string)) {
        return function(...args: any[]) {
          try {
            // Call the mock logger method to record the call
            originalMethod.apply(target, args);
            
            // Forward the call to the real logger
            const realMethod = Reflect.get(realLogger, prop);
            if (typeof realMethod === 'function') {
              realMethod.apply(realLogger, args);
            }
          } catch (error) {
            // If the mock throws (e.g., when simulateErrors is true), we still want to
            // record that the call happened, but we'll re-throw the error
            if (options.simulateErrors) {
              throw error;
            }
            // Otherwise, just log the error to the real logger
            if (realLogger.error) {
              realLogger.error(`Error in logger spy: ${error.message}`, error.stack);
            }
          }
          
          return undefined;
        };
      }
      
      return originalMethod;
    }
  }) as MockLoggerService & NestLoggerService;
}