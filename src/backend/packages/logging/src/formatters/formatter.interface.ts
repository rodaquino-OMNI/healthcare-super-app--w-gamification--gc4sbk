/**
 * @file formatter.interface.ts
 * @description Defines the core interfaces for log formatting in the AUSTA SuperApp.
 * This file establishes the contract for all log formatters and the standard structure
 * of log entries before formatting.
 */

import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Represents the standard structure of a log entry before formatting.
 * Contains all necessary fields for comprehensive logging, including context,
 * trace IDs, and journey information.
 */
export interface LogEntry {
  /**
   * The log message
   */
  message: string;

  /**
   * The severity level of the log
   */
  level: LogLevel;

  /**
   * ISO timestamp when the log was created
   */
  timestamp: string;

  /**
   * Optional context object containing additional information about the log
   */
  context?: Record<string, any>;

  /**
   * Optional service name that generated the log
   */
  service?: string;

  /**
   * Optional error object if this log represents an error
   */
  error?: Error | unknown;

  /**
   * Optional stack trace for error logs
   */
  stack?: string;

  /**
   * Optional request ID for tracking requests across services
   */
  requestId?: string;

  /**
   * Optional user ID for user-specific logs
   */
  userId?: string;

  /**
   * Optional journey identifier (health, care, plan)
   */
  journey?: 'health' | 'care' | 'plan' | string;

  /**
   * Optional trace ID for distributed tracing correlation
   */
  traceId?: string;

  /**
   * Optional span ID for distributed tracing correlation
   */
  spanId?: string;

  /**
   * Optional parent span ID for distributed tracing correlation
   */
  parentSpanId?: string;

  /**
   * Optional metadata object for additional structured information
   */
  metadata?: Record<string, any>;
}

/**
 * Formatter interface that all log formatters must implement.
 * Establishes a contract for transforming log entries into formatted output.
 */
export interface Formatter {
  /**
   * Formats a log entry into a string or object representation.
   * 
   * @param entry The log entry to format
   * @returns The formatted log entry as a string or object
   */
  format(entry: LogEntry): string | Record<string, any>;
}