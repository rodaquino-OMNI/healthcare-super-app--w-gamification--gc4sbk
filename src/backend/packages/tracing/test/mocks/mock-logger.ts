/**
 * Mock implementation of the NestJS LoggerService for testing
 * 
 * This mock simulates logging operations without requiring actual logging infrastructure
 * and tracks all log messages for test verification.
 */
export class MockLogger {
  public logs: { level: string; message: string; context?: string; trace?: string }[] = [];

  /**
   * Log an informational message
   */
  log(message: any, context?: string): void {
    this.logs.push({ level: 'log', message: String(message), context });
  }

  /**
   * Log an error message with optional stack trace
   */
  error(message: any, trace?: string, context?: string): void {
    this.logs.push({ level: 'error', message: String(message), context, trace });
  }

  /**
   * Log a warning message
   */
  warn(message: any, context?: string): void {
    this.logs.push({ level: 'warn', message: String(message), context });
  }

  /**
   * Log a debug message
   */
  debug(message: any, context?: string): void {
    this.logs.push({ level: 'debug', message: String(message), context });
  }

  /**
   * Log a verbose message
   */
  verbose(message: any, context?: string): void {
    this.logs.push({ level: 'verbose', message: String(message), context });
  }

  /**
   * Clear all logged messages
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get all logs of a specific level
   */
  getLogsByLevel(level: string): { level: string; message: string; context?: string; trace?: string }[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Check if a specific message was logged
   */
  hasLoggedMessage(message: string, level?: string): boolean {
    return this.logs.some(log => {
      if (level && log.level !== level) {
        return false;
      }
      return log.message.includes(message);
    });
  }
}