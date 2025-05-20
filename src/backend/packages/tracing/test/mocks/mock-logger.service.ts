import { LoggerService } from '@nestjs/common';

/**
 * Mock implementation of NestJS LoggerService for testing the tracing module.
 * This mock simulates logging operations without requiring actual logging infrastructure
 * and tracks all log messages for test verification purposes.
 * 
 * Enhanced for integration testing with TracingService to verify trace context propagation.
 */
export class MockLoggerService implements LoggerService {
  /**
   * Stores all log messages for verification in tests
   */
  public readonly logs: Array<{ 
    level: string; 
    message: any; 
    context?: string | object; 
    params?: any[];
    traceId?: string;
    spanId?: string;
    [key: string]: any;
  }> = [];

  /**
   * Logs a message at the 'log' level
   * @param message The message to log
   * @param context Optional context (string or object)
   */
  log(message: any, context?: string | object): void {
    this.addLog('log', message, context);
  }

  /**
   * Logs a message at the 'error' level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context (string or object)
   */
  error(message: any, trace?: string | Error, context?: string | object): void {
    this.addLog('error', message, context, trace);
  }

  /**
   * Logs a message at the 'warn' level
   * @param message The message to log
   * @param context Optional context (string or object)
   */
  warn(message: any, context?: string | object): void {
    this.addLog('warn', message, context);
  }

  /**
   * Logs a message at the 'debug' level
   * @param message The message to log
   * @param context Optional context (string or object)
   */
  debug(message: any, context?: string | object): void {
    this.addLog('debug', message, context);
  }

  /**
   * Logs a message at the 'verbose' level
   * @param message The message to log
   * @param context Optional context (string or object)
   */
  verbose(message: any, context?: string | object): void {
    this.addLog('verbose', message, context);
  }

  /**
   * Helper method to add a log entry to the logs array
   * @param level The log level
   * @param message The message to log
   * @param context Optional context (string or object)
   * @param trace Optional stack trace or error object
   */
  private addLog(level: string, message: any, context?: string | object, trace?: string | Error): void {
    // Simulate trace context enrichment that would happen in the real LoggerService
    // In a real implementation, this would come from the TracingService
    const traceContext = this.simulateTraceContext();
    
    // Create the log entry with all properties
    const logEntry: any = {
      level,
      message,
      context,
      ...(trace && { trace: typeof trace === 'string' ? trace : trace.stack }),
      ...traceContext,
    };
    
    // If context is an object, spread its properties into the log entry
    if (context && typeof context === 'object') {
      Object.assign(logEntry, context);
    }
    
    this.logs.push(logEntry);
  }

  /**
   * Simulates trace context extraction that would happen in the real LoggerService
   * This is a placeholder that will be overridden by the actual trace context in tests
   */
  private simulateTraceContext(): { traceId?: string; spanId?: string } {
    // In real implementation, this would call getTraceCorrelation() from the tracing service
    // For the mock, we'll return empty values that will be populated in tests
    return {};
  }

  /**
   * Clears all logged messages
   */
  clearLogs(): void {
    this.logs.length = 0;
  }

  /**
   * Gets logs filtered by level
   * @param level The log level to filter by
   * @returns Array of logs with the specified level
   */
  getLogsByLevel(level: string): Array<{ level: string; message: any; context?: string | object; [key: string]: any }> {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets all log entries (info level)
   */
  getLogEntries(): Array<{ level: string; message: any; context?: string | object; [key: string]: any }> {
    return this.getLogsByLevel('log');
  }

  /**
   * Gets all error log entries
   */
  getErrorLogEntries(): Array<{ level: string; message: any; context?: string | object; [key: string]: any }> {
    return this.getLogsByLevel('error');
  }

  /**
   * Gets all warning log entries
   */
  getWarnLogEntries(): Array<{ level: string; message: any; context?: string | object; [key: string]: any }> {
    return this.getLogsByLevel('warn');
  }

  /**
   * Gets all debug log entries
   */
  getDebugLogEntries(): Array<{ level: string; message: any; context?: string | object; [key: string]: any }> {
    return this.getLogsByLevel('debug');
  }

  /**
   * Gets all verbose log entries
   */
  getVerboseLogEntries(): Array<{ level: string; message: any; context?: string | object; [key: string]: any }> {
    return this.getLogsByLevel('verbose');
  }

  /**
   * Gets the context from the last log entry
   */
  getLastLogContext(): string | object | undefined {
    if (this.logs.length === 0) {
      return undefined;
    }
    return this.logs[this.logs.length - 1].context;
  }

  /**
   * Checks if a specific message was logged
   * @param level The log level to check
   * @param messageSubstring A substring to search for in the log messages
   * @returns True if a matching log was found, false otherwise
   */
  hasLoggedMessage(level: string, messageSubstring: string): boolean {
    return this.logs.some(log => 
      log.level === level && 
      (typeof log.message === 'string' ? 
        log.message.includes(messageSubstring) : 
        JSON.stringify(log.message).includes(messageSubstring))
    );
  }

  /**
   * Manually set trace context for a log entry (for testing)
   * @param index The index of the log entry to modify
   * @param traceId The trace ID to set
   * @param spanId The span ID to set
   */
  setTraceContext(index: number, traceId: string, spanId: string): void {
    if (index >= 0 && index < this.logs.length) {
      this.logs[index].traceId = traceId;
      this.logs[index].spanId = spanId;
    }
  }

  /**
   * Sets a mock implementation for the simulateTraceContext method
   * @param mockFn The mock function to use
   */
  setTraceContextSimulator(mockFn: () => { traceId?: string; spanId?: string }): void {
    this.simulateTraceContext = mockFn;
  }
}