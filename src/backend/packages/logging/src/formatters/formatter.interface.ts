/**
 * Interface defining the structure of a log entry before formatting.
 * This represents the standardized log data structure used across all services
 * in the AUSTA SuperApp.
 */
export interface LogEntry {
  /**
   * Timestamp when the log entry was created
   */
  timestamp: Date;

  /**
   * Log level indicating the severity of the log entry
   */
  level: LogLevel;

  /**
   * The main log message
   */
  message: string;

  /**
   * Optional context information about where the log was generated
   */
  context?: string;

  /**
   * Optional error object or stack trace for error logs
   */
  error?: Error | string;

  /**
   * Optional metadata providing additional structured information
   */
  metadata?: Record<string, any>;

  /**
   * Optional correlation ID for distributed tracing
   */
  traceId?: string;

  /**
   * Optional span ID for distributed tracing
   */
  spanId?: string;

  /**
   * Optional user ID associated with the log entry
   */
  userId?: string;

  /**
   * Optional request ID associated with the log entry
   */
  requestId?: string;

  /**
   * Optional journey identifier (Health, Care, Plan) associated with the log entry
   */
  journey?: JourneyType;

  /**
   * Optional service name that generated the log
   */
  service?: string;

  /**
   * Optional environment information (development, staging, production)
   */
  environment?: string;
}

/**
 * Enum defining the standard log levels used across the application
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * Enum defining the journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Interface that all log formatters must implement.
 * Formatters are responsible for transforming LogEntry objects into formatted output
 * strings or objects suitable for various logging transports.
 */
export interface Formatter {
  /**
   * Formats a log entry into the desired output format.
   * 
   * @param entry The log entry to format
   * @returns The formatted log entry as a string or object, depending on the formatter implementation
   */
  format(entry: LogEntry): string | Record<string, any>;
}