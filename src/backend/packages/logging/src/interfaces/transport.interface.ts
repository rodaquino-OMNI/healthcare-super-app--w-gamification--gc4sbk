/**
 * @file Transport Interface
 * @description Defines the Transport interface that all log transport implementations must implement
 * to handle the actual writing of log entries to various destinations.
 *
 * @module @austa/logging/interfaces
 */

import { LogEntry } from './log-entry.interface';

/**
 * Configuration options for a log transport.
 * Each transport implementation can extend this interface with its own specific options.
 */
export interface TransportConfig {
  /**
   * Name of the transport for identification purposes.
   */
  name: string;

  /**
   * Whether the transport is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Maximum number of log entries to batch before writing.
   * Set to 0 to disable batching.
   * @default 0
   */
  batchSize?: number;

  /**
   * Maximum time in milliseconds to wait before flushing the batch.
   * Only applicable if batchSize > 0.
   * @default 1000
   */
  flushInterval?: number;

  /**
   * Number of retry attempts for failed write operations.
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Base delay in milliseconds between retry attempts.
   * Actual delay will use exponential backoff strategy.
   * @default 100
   */
  retryDelay?: number;

  /**
   * Whether to throw errors when write operations fail after all retries.
   * If false, errors will be logged but not thrown.
   * @default false
   */
  throwOnError?: boolean;
}

/**
 * Result of a write operation to a transport.
 */
export interface WriteResult {
  /**
   * Whether the write operation was successful.
   */
  success: boolean;

  /**
   * Number of log entries successfully written.
   */
  entriesWritten: number;

  /**
   * Error that occurred during the write operation, if any.
   */
  error?: Error;

  /**
   * Additional metadata about the write operation.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface that all log transport implementations must implement.
 * A transport is responsible for writing log entries to a specific destination,
 * such as the console, a file, or a remote logging service.
 */
export interface Transport {
  /**
   * The name of the transport.
   */
  readonly name: string;

  /**
   * The configuration of the transport.
   */
  readonly config: TransportConfig;

  /**
   * Initializes the transport.
   * This method is called once when the transport is created.
   * Use this method to set up connections, create resources, or perform other initialization tasks.
   * 
   * @returns A promise that resolves when initialization is complete.
   * @throws If initialization fails.
   */
  initialize(): Promise<void>;

  /**
   * Writes a single log entry to the transport destination.
   * 
   * @param entry The log entry to write.
   * @returns A promise that resolves with the result of the write operation.
   */
  write(entry: LogEntry): Promise<WriteResult>;

  /**
   * Writes multiple log entries to the transport destination in a batch.
   * This method is optional and can be implemented for better performance when writing multiple entries.
   * If not implemented, the default implementation will call write() for each entry.
   * 
   * @param entries The log entries to write.
   * @returns A promise that resolves with the result of the batch write operation.
   */
  writeBatch?(entries: LogEntry[]): Promise<WriteResult>;

  /**
   * Flushes any buffered log entries to the transport destination.
   * This method is called when the logger needs to ensure all entries are written,
   * such as before application shutdown.
   * 
   * @returns A promise that resolves when all buffered entries have been written.
   */
  flush(): Promise<void>;

  /**
   * Closes the transport, releasing any resources it holds.
   * This method is called when the transport is no longer needed,
   * typically during application shutdown.
   * 
   * @returns A promise that resolves when the transport has been closed.
   */
  close(): Promise<void>;

  /**
   * Checks if the transport is healthy and able to write log entries.
   * This method can be used for health checks and monitoring.
   * 
   * @returns A promise that resolves with true if the transport is healthy, false otherwise.
   */
  isHealthy(): Promise<boolean>;
}