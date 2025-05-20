import { LoggerService } from '@nestjs/common';

/**
 * Mock implementation of NestJS LoggerService for testing the tracing module.
 * This mock simulates logging operations without requiring actual logging infrastructure
 * and tracks all log messages for test verification purposes.
 */
export class MockLoggerService implements LoggerService {
  /**
   * Stores all log messages for verification in tests
   */
  public readonly logs: Array<{ level: string; message: any; context?: string; params?: any[] }> = [];

  /**
   * Logs a message at the 'log' level
   * @param message The message to log
   * @param optionalParams Optional parameters (context and additional data)
   */
  log(message: any, ...optionalParams: any[]): void {
    this.addLog('log', message, optionalParams);
  }

  /**
   * Logs a message at the 'error' level
   * @param message The message to log
   * @param optionalParams Optional parameters (stack trace, context, etc.)
   */
  error(message: any, ...optionalParams: any[]): void {
    this.addLog('error', message, optionalParams);
  }

  /**
   * Logs a message at the 'warn' level
   * @param message The message to log
   * @param optionalParams Optional parameters (context and additional data)
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.addLog('warn', message, optionalParams);
  }

  /**
   * Logs a message at the 'debug' level
   * @param message The message to log
   * @param optionalParams Optional parameters (context and additional data)
   */
  debug(message: any, ...optionalParams: any[]): void {
    this.addLog('debug', message, optionalParams);
  }

  /**
   * Logs a message at the 'verbose' level
   * @param message The message to log
   * @param optionalParams Optional parameters (context and additional data)
   */
  verbose(message: any, ...optionalParams: any[]): void {
    this.addLog('verbose', message, optionalParams);
  }

  /**
   * Helper method to add a log entry to the logs array
   * @param level The log level
   * @param message The message to log
   * @param params Optional parameters
   */
  private addLog(level: string, message: any, params: any[] = []): void {
    // In NestJS, the last parameter is often the context
    const context = params.length > 0 && typeof params[params.length - 1] === 'string' 
      ? params[params.length - 1] 
      : undefined;
    
    this.logs.push({
      level,
      message,
      context,
      params: params.length > 0 ? params : undefined
    });
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
  getLogsByLevel(level: string): Array<{ level: string; message: any; context?: string; params?: any[] }> {
    return this.logs.filter(log => log.level === level);
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
}