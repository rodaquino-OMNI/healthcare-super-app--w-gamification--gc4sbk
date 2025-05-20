import { Injectable } from '@nestjs/common';
import { Formatter, LogEntry } from './formatter.interface';

/**
 * JsonFormatter implements the Formatter interface to transform log entries into structured JSON format.
 * 
 * This formatter ensures that logs are machine-readable and include all necessary context,
 * metadata, and correlation IDs for proper observability. It's suitable for CloudWatch and
 * other log aggregation systems that work with JSON-formatted logs.
 */
@Injectable()
export class JsonFormatter implements Formatter {
  /**
   * Formats a log entry into a JSON string.
   * 
   * @param entry The log entry to format
   * @returns A JSON string representation of the log entry
   */
  format(entry: LogEntry): string {
    // Create a copy of the entry to avoid modifying the original
    const formattedEntry = { ...entry };

    // Ensure timestamp is properly formatted
    if (formattedEntry.timestamp instanceof Date) {
      formattedEntry.timestamp = formattedEntry.timestamp.toISOString();
    } else if (typeof formattedEntry.timestamp === 'number') {
      formattedEntry.timestamp = new Date(formattedEntry.timestamp).toISOString();
    }

    // Format error objects for better serialization
    if (formattedEntry.error) {
      formattedEntry.error = this.formatError(formattedEntry.error);
    }

    // Convert to JSON string with proper error handling
    try {
      return JSON.stringify(formattedEntry);
    } catch (error) {
      // If JSON serialization fails, return a fallback error log
      return JSON.stringify({
        level: formattedEntry.level,
        message: 'Error serializing log entry',
        timestamp: new Date().toISOString(),
        error: this.formatError(error),
        originalMessage: formattedEntry.message,
      });
    }
  }

  /**
   * Formats an error object for proper JSON serialization.
   * 
   * @param error The error object to format
   * @returns A serializable error object
   */
  protected formatError(error: any): any {
    if (!error) {
      return null;
    }

    // If it's already a string, return it
    if (typeof error === 'string') {
      return error;
    }

    // Create a serializable error object
    const formattedError: any = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack || '',
    };

    // Add additional properties from the error object
    for (const key in error) {
      if (Object.prototype.hasOwnProperty.call(error, key) && 
          !['message', 'name', 'stack'].includes(key)) {
        try {
          // Try to serialize the property
          JSON.stringify({ [key]: error[key] });
          formattedError[key] = error[key];
        } catch (e) {
          // If serialization fails, convert to string
          formattedError[key] = `[Non-serializable ${typeof error[key]}]`;
        }
      }
    }

    return formattedError;
  }
}