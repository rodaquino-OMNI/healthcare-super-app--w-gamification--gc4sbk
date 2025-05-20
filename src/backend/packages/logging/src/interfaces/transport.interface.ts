/**
 * @file transport.interface.ts
 * @description Defines the Transport interface that all log transport implementations must implement
 * to handle the actual writing of log entries to various destinations. This interface includes methods
 * for initializing, writing logs, and managing the transport lifecycle.
 */

import { LogLevel } from './log-level.enum';
import { TransportConfig } from './log-config.interface';

/**
 * Represents a structured log entry to be written by a transport
 */
export interface LogEntry {
  /**
   * Log level of the entry
   */
  level: LogLevel;

  /**
   * Timestamp of when the log entry was created
   */
  timestamp: Date;

  /**
   * Log message
   */
  message: string;

  /**
   * Optional error object or stack trace
   */
  error?: Error | string;

  /**
   * Context information for the log entry
   */
  context?: Record<string, any>;

  /**
   * Trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * Service name that generated the log
   */
  service?: string;

  /**
   * Journey identifier (health, care, plan)
   */
  journey?: string;

  /**
   * Additional metadata for the log entry
   */
  meta?: Record<string, any>;
}

/**
 * Represents a batch of log entries to be written together
 */
export interface LogBatch {
  /**
   * Array of log entries in the batch
   */
  entries: LogEntry[];

  /**
   * Optional callback to be called when the batch is written
   */
  callback?: (error?: Error) => void;
}

/**
 * Interface that all log transport implementations must implement
 * to handle the actual writing of log entries to various destinations.
 */
export interface Transport {
  /**
   * Unique identifier for the transport instance
   */
  readonly id: string;

  /**
   * Transport type identifier
   */
  readonly type: string;

  /**
   * Minimum log level this transport will process
   */
  readonly level: LogLevel;

  /**
   * Whether the transport is currently active
   */
  readonly active: boolean;

  /**
   * Initializes the transport with the provided configuration
   * Must be called before any log entries can be written
   * 
   * @param config Transport configuration
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  initialize(config: TransportConfig): Promise<void>;

  /**
   * Writes a single log entry to the transport destination
   * 
   * @param entry Log entry to write
   * @returns Promise that resolves when the write is complete
   * @throws Error if the write operation fails
   */
  write(entry: LogEntry): Promise<void>;

  /**
   * Writes a batch of log entries to the transport destination
   * Implementations should optimize for batch processing when possible
   * 
   * @param batch Batch of log entries to write
   * @returns Promise that resolves when all entries in the batch are written
   * @throws Error if the batch write operation fails
   */
  writeBatch(batch: LogBatch): Promise<void>;

  /**
   * Flushes any buffered log entries to ensure they are written
   * Should be called before application shutdown
   * 
   * @returns Promise that resolves when all buffered entries are written
   * @throws Error if the flush operation fails
   */
  flush(): Promise<void>;

  /**
   * Closes the transport and releases any resources
   * Must be called when the transport is no longer needed
   * 
   * @returns Promise that resolves when the transport is closed
   * @throws Error if the close operation fails
   */
  close(): Promise<void>;

  /**
   * Checks if a log entry should be processed by this transport
   * based on its level and other criteria
   * 
   * @param entry Log entry to check
   * @returns True if the entry should be processed, false otherwise
   */
  shouldProcess(entry: LogEntry): boolean;

  /**
   * Handles transport-specific errors
   * Implementations should provide appropriate error handling and recovery
   * 
   * @param error Error that occurred during transport operations
   * @param context Additional context about the operation that failed
   * @returns Promise that resolves when error handling is complete
   */
  handleError(error: Error, context?: Record<string, any>): Promise<void>;
}