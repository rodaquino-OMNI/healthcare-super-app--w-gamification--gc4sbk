import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Represents a structured log entry before formatting.
 * This interface defines the standard structure of log entries that will be passed to formatters.
 */
export interface LogEntry {
  /**
   * The log message
   */
  message: string;
  
  /**
   * The log level
   */
  level: LogLevel;
  
  /**
   * Timestamp of the log entry
   */
  timestamp: string | number | Date;
  
  /**
   * Optional error object or message
   */
  error?: any;
  
  /**
   * Optional context information for the log entry
   */
  context?: {
    /**
     * Service name or identifier
     */
    service?: string;
    
    /**
     * Journey identifier (health, care, plan)
     */
    journey?: string;
    
    /**
     * Request-specific context
     */
    request?: {
      /**
       * Request ID for correlation
       */
      id?: string;
      
      /**
       * HTTP method
       */
      method?: string;
      
      /**
       * Request path
       */
      path?: string;
      
      /**
       * User ID associated with the request
       */
      userId?: string;
      
      /**
       * Request duration in milliseconds
       */
      duration?: number;
    };
    
    /**
     * Trace context for distributed tracing
     */
    trace?: {
      /**
       * Trace ID for correlation across services
       */
      id?: string;
      
      /**
       * Current span ID
       */
      spanId?: string;
      
      /**
       * Parent span ID for nested spans
       */
      parentSpanId?: string;
    };
    
    /**
     * Additional metadata for the log entry
     */
    [key: string]: any;
  };
  
  /**
   * Additional properties for the log entry
   */
  [key: string]: any;
}

/**
 * Formatter interface that all log formatters must implement.
 * This interface establishes a contract for transforming log entries into formatted output.
 */
export interface Formatter {
  /**
   * Formats a log entry into a string representation.
   * 
   * @param entry The log entry to format
   * @returns A formatted string representation of the log entry
   */
  format(entry: LogEntry): string;
}