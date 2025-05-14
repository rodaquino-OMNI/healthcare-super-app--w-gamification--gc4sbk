import { LogLevel } from './log-level.enum';
import { LogEntry } from './log-entry.interface';

/**
 * Status of a transport operation
 */
export enum TransportStatus {
  /**
   * Operation completed successfully
   */
  SUCCESS = 'success',

  /**
   * Operation failed but can be retried
   */
  RETRYABLE_ERROR = 'retryable_error',

  /**
   * Operation failed and should not be retried
   */
  PERMANENT_ERROR = 'permanent_error',
}

/**
 * Result of a transport write operation
 */
export interface TransportWriteResult {
  /**
   * Status of the write operation
   */
  status: TransportStatus;

  /**
   * Error object if the operation failed
   */
  error?: Error;

  /**
   * Number of log entries successfully written
   */
  entriesWritten?: number;

  /**
   * Additional metadata about the write operation
   */
  metadata?: Record<string, any>;
}

/**
 * Options for batch writing log entries
 */
export interface BatchWriteOptions {
  /**
   * Maximum number of retries for failed batch operations
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay in milliseconds between retry attempts
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Whether to use exponential backoff for retries
   * @default true
   */
  useExponentialBackoff?: boolean;

  /**
   * Custom callback to handle failed entries after all retries
   */
  onFailure?: (entries: LogEntry[], error: Error) => void;
}

/**
 * Interface that all log transport implementations must implement
 * to handle the actual writing of log entries to various destinations.
 */
export interface Transport {
  /**
   * Name of the transport for identification
   */
  readonly name: string;

  /**
   * Current status of the transport
   */
  readonly isInitialized: boolean;

  /**
   * Minimum log level this transport will process
   */
  readonly level: LogLevel;

  /**
   * Initialize the transport with any necessary setup
   * Must be called before any log entries can be written
   * 
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Write a single log entry to the transport destination
   * 
   * @param entry The log entry to write
   * @returns Promise that resolves with the result of the write operation
   */
  write(entry: LogEntry): Promise<TransportWriteResult>;

  /**
   * Write multiple log entries in a batch for better performance
   * 
   * @param entries Array of log entries to write
   * @param options Optional configuration for batch writing
   * @returns Promise that resolves with the result of the batch write operation
   */
  writeBatch(entries: LogEntry[], options?: BatchWriteOptions): Promise<TransportWriteResult>;

  /**
   * Check if this transport will accept a log entry based on its level
   * 
   * @param level The log level to check
   * @returns True if the transport will accept entries at this level
   */
  isLevelEnabled(level: LogLevel): boolean;

  /**
   * Flush any buffered log entries to ensure they are written
   * 
   * @returns Promise that resolves when all buffered entries are written
   */
  flush(): Promise<void>;

  /**
   * Close the transport and release any resources
   * Should be called when the transport is no longer needed
   * 
   * @returns Promise that resolves when the transport is closed
   */
  close(): Promise<void>;
}