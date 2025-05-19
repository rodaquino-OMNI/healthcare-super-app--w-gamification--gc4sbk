import { LoggerService } from '@nestjs/common';

/**
 * Message structure for logged messages
 */
export interface LoggedMessage {
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  message: string;
  optionalParams: any[];
}

/**
 * Mock implementation of NestJS LoggerService for testing purposes.
 * Tracks all logged messages for verification in tests.
 */
export class MockLoggerService implements LoggerService {
  private messages: LoggedMessage[] = [];

  /**
   * Logs a message at the 'log' level
   * @param message The message to log
   * @param optionalParams Additional parameters (context, etc.)
   */
  log(message: any, ...optionalParams: any[]): void {
    this.messages.push({
      level: 'log',
      message: String(message),
      optionalParams,
    });
  }

  /**
   * Logs a message at the 'error' level
   * @param message The message to log
   * @param optionalParams Additional parameters (stack trace, context, etc.)
   */
  error(message: any, ...optionalParams: any[]): void {
    this.messages.push({
      level: 'error',
      message: String(message),
      optionalParams,
    });
  }

  /**
   * Logs a message at the 'warn' level
   * @param message The message to log
   * @param optionalParams Additional parameters (context, etc.)
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.messages.push({
      level: 'warn',
      message: String(message),
      optionalParams,
    });
  }

  /**
   * Logs a message at the 'debug' level
   * @param message The message to log
   * @param optionalParams Additional parameters (context, etc.)
   */
  debug(message: any, ...optionalParams: any[]): void {
    this.messages.push({
      level: 'debug',
      message: String(message),
      optionalParams,
    });
  }

  /**
   * Logs a message at the 'verbose' level
   * @param message The message to log
   * @param optionalParams Additional parameters (context, etc.)
   */
  verbose(message: any, ...optionalParams: any[]): void {
    this.messages.push({
      level: 'verbose',
      message: String(message),
      optionalParams,
    });
  }

  /**
   * Gets all logged messages
   * @returns Array of logged messages
   */
  getMessages(): LoggedMessage[] {
    return [...this.messages];
  }

  /**
   * Gets messages of a specific level
   * @param level The log level to filter by
   * @returns Array of logged messages at the specified level
   */
  getMessagesByLevel(level: LoggedMessage['level']): LoggedMessage[] {
    return this.messages.filter((msg) => msg.level === level);
  }

  /**
   * Clears all logged messages
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Checks if a specific message was logged
   * @param level The log level to check
   * @param messageSubstring A substring to search for in the message
   * @returns True if a matching message was found, false otherwise
   */
  hasMessage(level: LoggedMessage['level'], messageSubstring: string): boolean {
    return this.messages.some(
      (msg) => msg.level === level && msg.message.includes(messageSubstring)
    );
  }

  /**
   * Checks if a specific message was logged with a particular context
   * @param level The log level to check
   * @param messageSubstring A substring to search for in the message
   * @param context The context string to match
   * @returns True if a matching message with the context was found, false otherwise
   */
  hasMessageWithContext(level: LoggedMessage['level'], messageSubstring: string, context: string): boolean {
    return this.messages.some(
      (msg) => 
        msg.level === level && 
        msg.message.includes(messageSubstring) &&
        msg.optionalParams.includes(context)
    );
  }

  /**
   * Gets the count of messages at a specific level
   * @param level The log level to count
   * @returns The number of messages at the specified level
   */
  getMessageCount(level?: LoggedMessage['level']): number {
    if (level) {
      return this.getMessagesByLevel(level).length;
    }
    return this.messages.length;
  }
}