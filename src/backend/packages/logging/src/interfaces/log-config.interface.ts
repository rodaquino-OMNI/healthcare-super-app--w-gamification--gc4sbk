import { LogLevel } from './log-level.enum';

/**
 * Configuration options for the console transport
 */
export interface ConsoleTransportConfig {
  /**
   * Enable or disable the console transport
   * @default true
   */
  enabled?: boolean;

  /**
   * Enable or disable colorized output in console logs
   * @default true
   */
  colorize?: boolean;

  /**
   * Enable or disable pretty printing of objects and errors
   * @default true in development, false in production
   */
  prettyPrint?: boolean;

  /**
   * Minimum log level to output to console
   * @default LogLevel.DEBUG in development, LogLevel.INFO in production
   */
  level?: LogLevel;
}

/**
 * Configuration options for the file transport
 */
export interface FileTransportConfig {
  /**
   * Enable or disable the file transport
   * @default false
   */
  enabled?: boolean;

  /**
   * Directory path where log files will be stored
   * @default './logs'
   */
  directory?: string;

  /**
   * Base filename for log files
   * @default 'application'
   */
  filename?: string;

  /**
   * Maximum size of each log file before rotation (in bytes)
   * @default 10485760 (10MB)
   */
  maxSize?: number;

  /**
   * Maximum number of log files to keep
   * @default 5
   */
  maxFiles?: number;

  /**
   * Enable or disable log file compression
   * @default true
   */
  compress?: boolean;

  /**
   * Minimum log level to output to file
   * @default LogLevel.INFO
   */
  level?: LogLevel;
}

/**
 * Configuration options for the AWS CloudWatch transport
 */
export interface CloudWatchTransportConfig {
  /**
   * Enable or disable the CloudWatch transport
   * @default false in development, true in production
   */
  enabled?: boolean;

  /**
   * AWS region for CloudWatch Logs
   * @default process.env.AWS_REGION || 'us-east-1'
   */
  region?: string;

  /**
   * CloudWatch log group name
   * @default 'austa-superapp'
   */
  logGroupName?: string;

  /**
   * CloudWatch log stream name
   * @default '{service-name}-{environment}'
   */
  logStreamName?: string;

  /**
   * Number of log entries to batch before sending to CloudWatch
   * @default 50
   */
  batchSize?: number;

  /**
   * Interval in milliseconds to flush logs to CloudWatch even if batch size isn't reached
   * @default 5000 (5 seconds)
   */
  flushInterval?: number;

  /**
   * Maximum number of retries for failed CloudWatch API calls
   * @default 3
   */
  maxRetries?: number;

  /**
   * Minimum log level to send to CloudWatch
   * @default LogLevel.INFO
   */
  level?: LogLevel;
}

/**
 * Configuration options for all log transports
 */
export interface TransportConfig {
  /**
   * Console transport configuration
   */
  console?: ConsoleTransportConfig;

  /**
   * File transport configuration
   */
  file?: FileTransportConfig;

  /**
   * CloudWatch transport configuration
   */
  cloudWatch?: CloudWatchTransportConfig;
}

/**
 * Configuration options for log formatters
 */
export interface FormatterConfig {
  /**
   * Default formatter to use
   * @default 'json' in production, 'text' in development
   */
  default?: 'json' | 'text' | 'cloudwatch';

  /**
   * Enable or disable pretty printing of JSON in development
   * @default true in development, false in production
   */
  prettyPrint?: boolean;

  /**
   * Include or exclude stack traces in error objects
   * @default true
   */
  includeStacktraces?: boolean;

  /**
   * Maximum depth for object serialization
   * @default 5
   */
  maxObjectDepth?: number;
}

/**
 * Configuration options for context enrichment
 */
export interface ContextConfig {
  /**
   * Enable or disable automatic context enrichment
   * @default true
   */
  enabled?: boolean;

  /**
   * Default service name to include in logs
   * @default process.env.SERVICE_NAME || 'austa-service'
   */
  serviceName?: string;

  /**
   * Default application name to include in logs
   * @default 'austa-superapp'
   */
  appName?: string;

  /**
   * Environment name (development, staging, production)
   * @default process.env.NODE_ENV || 'development'
   */
  environment?: string;

  /**
   * Fields to sanitize from logs (passwords, tokens, etc.)
   * @default ['password', 'token', 'secret', 'authorization', 'apiKey']
   */
  sanitizeFields?: string[];

  /**
   * Enable or disable request context enrichment
   * @default true
   */
  includeRequestContext?: boolean;

  /**
   * Enable or disable user context enrichment
   * @default true
   */
  includeUserContext?: boolean;

  /**
   * Enable or disable journey context enrichment
   * @default true
   */
  includeJourneyContext?: boolean;
}

/**
 * Configuration options for journey-specific logging
 */
export interface JourneyConfig {
  /**
   * Health journey logging configuration
   */
  health?: {
    /**
     * Minimum log level for health journey logs
     * @default LogLevel.INFO
     */
    level?: LogLevel;

    /**
     * Additional context fields to include in health journey logs
     */
    additionalContext?: Record<string, any>;
  };

  /**
   * Care journey logging configuration
   */
  care?: {
    /**
     * Minimum log level for care journey logs
     * @default LogLevel.INFO
     */
    level?: LogLevel;

    /**
     * Additional context fields to include in care journey logs
     */
    additionalContext?: Record<string, any>;
  };

  /**
   * Plan journey logging configuration
   */
  plan?: {
    /**
     * Minimum log level for plan journey logs
     * @default LogLevel.INFO
     */
    level?: LogLevel;

    /**
     * Additional context fields to include in plan journey logs
     */
    additionalContext?: Record<string, any>;
  };
}

/**
 * Configuration options for tracing integration
 */
export interface TracingConfig {
  /**
   * Enable or disable tracing integration
   * @default true
   */
  enabled?: boolean;

  /**
   * Name of the trace ID field in logs
   * @default 'traceId'
   */
  traceIdField?: string;

  /**
   * Name of the span ID field in logs
   * @default 'spanId'
   */
  spanIdField?: string;

  /**
   * Enable or disable AWS X-Ray trace ID format compatibility
   * @default false
   */
  xrayFormat?: boolean;
}

/**
 * Comprehensive configuration interface for the logging system
 */
export interface LoggerConfig {
  /**
   * Default minimum log level for the application
   * @default LogLevel.INFO
   */
  level?: LogLevel;

  /**
   * Transport configuration for different log destinations
   */
  transports?: TransportConfig;

  /**
   * Formatter configuration for log output format
   */
  formatters?: FormatterConfig;

  /**
   * Context configuration for log enrichment
   */
  context?: ContextConfig;

  /**
   * Journey-specific logging configuration
   */
  journeys?: JourneyConfig;

  /**
   * Tracing integration configuration
   */
  tracing?: TracingConfig;

  /**
   * Enable or disable logging entirely
   * @default true
   */
  enabled?: boolean;

  /**
   * Enable or disable debug mode (more verbose internal logging)
   * @default false
   */
  debug?: boolean;

  /**
   * Maximum number of log entries to keep in memory buffer before dropping
   * @default 1000
   */
  maxBufferSize?: number;

  /**
   * Enable or disable automatic error logging for uncaught exceptions
   * @default true
   */
  captureExceptions?: boolean;

  /**
   * Enable or disable automatic error logging for unhandled promise rejections
   * @default true
   */
  captureRejections?: boolean;

  /**
   * Exit process after logging uncaught exceptions
   * @default true in production, false in development
   */
  exitOnError?: boolean;
}