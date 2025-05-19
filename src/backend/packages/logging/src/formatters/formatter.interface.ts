/**
 * Interface defining the contract for log formatters in the AUSTA SuperApp.
 * All log formatters must implement this interface to ensure consistent
 * formatting across different output targets (JSON, text, CloudWatch, etc.).
 */
export interface Formatter {
  /**
   * Transforms a log entry into a formatted output string.
   * @param entry The log entry to format
   * @returns The formatted log entry as a string
   */
  format(entry: LogEntry): string;
}

/**
 * Enum defining the standard log levels used throughout the application.
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Interface defining the journey types in the AUSTA SuperApp.
 * Used for journey-specific context in logs.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface defining the structure of error information in log entries.
 */
export interface LogErrorInfo {
  /**
   * The error message
   */
  message: string;
  
  /**
   * The error name or type
   */
  name?: string;
  
  /**
   * The error stack trace
   */
  stack?: string;
  
  /**
   * The error code, if available
   */
  code?: string | number;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
}

/**
 * Interface defining the trace context for distributed tracing integration.
 */
export interface TraceContext {
  /**
   * The trace ID that connects logs across service boundaries
   */
  traceId: string;
  
  /**
   * The span ID for the current operation
   */
  spanId?: string;
  
  /**
   * The parent span ID, if applicable
   */
  parentSpanId?: string;
  
  /**
   * Whether this trace is sampled for detailed analysis
   */
  sampled?: boolean;
  
  /**
   * Additional trace attributes
   */
  attributes?: Record<string, any>;
}

/**
 * Interface defining the journey context for journey-specific logging.
 */
export interface JourneyContext {
  /**
   * The type of journey (health, care, plan)
   */
  journeyType?: JourneyType;
  
  /**
   * The journey-specific context ID
   */
  journeyId?: string;
  
  /**
   * Additional journey-specific metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Interface defining the standard structure of log entries before formatting.
 * This is the core data structure that all formatters transform into their
 * specific output format.
 */
export interface LogEntry {
  /**
   * The timestamp when the log entry was created
   */
  timestamp: Date;
  
  /**
   * The log level indicating severity
   */
  level: LogLevel;
  
  /**
   * The log message
   */
  message: string;
  
  /**
   * The service or component that generated the log
   */
  service: string;
  
  /**
   * Optional context information for the log entry
   */
  context?: {
    /**
     * The request ID for HTTP/API requests
     */
    requestId?: string;
    
    /**
     * The user ID for authenticated users
     */
    userId?: string;
    
    /**
     * The session ID for user sessions
     */
    sessionId?: string;
    
    /**
     * The journey context for journey-specific logs
     */
    journey?: JourneyContext;
    
    /**
     * Additional context metadata
     */
    [key: string]: any;
  };
  
  /**
   * Optional error information for error logs
   */
  error?: LogErrorInfo;
  
  /**
   * Optional trace context for distributed tracing integration
   */
  trace?: TraceContext;
  
  /**
   * Optional metadata for additional structured information
   */
  metadata?: Record<string, any>;
  
  /**
   * Optional hostname of the server generating the log
   */
  hostname?: string;
  
  /**
   * Optional environment information (development, staging, production)
   */
  environment?: string;
  
  /**
   * Optional version information for the service
   */
  version?: string;
}