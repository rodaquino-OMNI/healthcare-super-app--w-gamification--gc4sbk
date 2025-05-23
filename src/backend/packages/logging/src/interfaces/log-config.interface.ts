import { LogLevel } from './log-level.enum';

/**
 * Configuration options for CloudWatch transport
 */
export interface CloudWatchTransportConfig {
  /**
   * AWS region for CloudWatch Logs
   */
  region: string;

  /**
   * CloudWatch log group name
   * @default 'austa-superapp'
   */
  logGroupName?: string;

  /**
   * CloudWatch log stream name
   * If not provided, will be generated based on service name and environment
   */
  logStreamName?: string;

  /**
   * Number of days to retain logs in CloudWatch
   * @default 30
   */
  retentionDays?: number;

  /**
   * Maximum batch size for CloudWatch Logs API calls
   * @default 10000
   */
  batchSize?: number;

  /**
   * Interval in milliseconds to flush logs to CloudWatch
   * @default 1000
   */
  flushInterval?: number;

  /**
   * Maximum number of retries for failed CloudWatch API calls
   * @default 3
   */
  maxRetries?: number;

  /**
   * Whether to create the log group if it doesn't exist
   * @default true
   */
  createLogGroup?: boolean;

  /**
   * AWS credentials configuration (optional if using instance profiles)
   */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

/**
 * Configuration options for File transport
 */
export interface FileTransportConfig {
  /**
   * Directory path for log files
   * @default 'logs'
   */
  directory?: string;

  /**
   * Filename pattern for log files
   * @default '%DATE%.log'
   */
  filename?: string;

  /**
   * Maximum size of log files before rotation
   * @default '20m'
   */
  maxSize?: string;

  /**
   * Maximum number of log files to keep
   * @default 5
   */
  maxFiles?: number;

  /**
   * Whether to compress rotated logs
   * @default true
   */
  compress?: boolean;

  /**
   * Whether to append to existing log files
   * @default true
   */
  append?: boolean;

  /**
   * Whether to include timestamp in filename
   * @default true
   */
  datePattern?: string;

  /**
   * Whether to create the directory if it doesn't exist
   * @default true
   */
  createDirectory?: boolean;
}

/**
 * Configuration options for Console transport
 */
export interface ConsoleTransportConfig {
  /**
   * Whether to use colors in console output
   * @default true
   */
  colorize?: boolean;

  /**
   * Whether to include timestamps in console output
   * @default true
   */
  timestamp?: boolean;

  /**
   * Whether to pretty-print objects in console output
   * @default true in development, false in production
   */
  prettyPrint?: boolean;

  /**
   * Whether to include stack traces for errors
   * @default true
   */
  includeStackTrace?: boolean;
}

/**
 * Available formatter types
 */
export enum FormatterType {
  JSON = 'json',
  TEXT = 'text',
  CLOUDWATCH = 'cloudwatch'
}

/**
 * Available transport types
 */
export enum TransportType {
  CONSOLE = 'console',
  FILE = 'file',
  CLOUDWATCH = 'cloudwatch'
}

/**
 * Configuration for a specific transport
 */
export interface TransportConfig {
  /**
   * Transport type
   */
  type: TransportType;

  /**
   * Formatter to use for this transport
   * @default FormatterType.JSON for CloudWatch, FormatterType.TEXT for Console in development
   */
  formatter?: FormatterType;

  /**
   * Minimum log level for this transport
   */
  level?: LogLevel;

  /**
   * Whether this transport is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Transport-specific configuration
   */
  config?: CloudWatchTransportConfig | FileTransportConfig | ConsoleTransportConfig;
}

/**
 * Default context values for logging
 */
export interface ContextDefaults {
  /**
   * Default service name
   */
  serviceName?: string;

  /**
   * Default application name
   */
  appName?: string;

  /**
   * Default environment name
   */
  environment?: string;

  /**
   * Default journey context values
   */
  journey?: {
    /**
     * Default journey type if not specified
     */
    defaultType?: 'HEALTH' | 'CARE' | 'PLAN';
  };

  /**
   * Additional default context values
   */
  [key: string]: any;
}

/**
 * Configuration for trace correlation
 */
export interface TraceCorrelationConfig {
  /**
   * Whether to enable trace correlation
   * @default true
   */
  enabled?: boolean;

  /**
   * Header name for trace ID
   * @default 'X-Trace-ID'
   */
  traceIdHeader?: string;

  /**
   * Header name for span ID
   * @default 'X-Span-ID'
   */
  spanIdHeader?: string;

  /**
   * Whether to generate trace IDs if not present
   * @default true
   */
  generateIfMissing?: boolean;

  /**
   * Whether to integrate with AWS X-Ray
   * @default false
   */
  xrayIntegration?: boolean;
}

/**
 * Configuration for sanitization of sensitive data
 */
export interface SanitizationConfig {
  /**
   * Whether to enable sanitization
   * @default true
   */
  enabled?: boolean;

  /**
   * Fields to redact from logs
   * @default ['password', 'token', 'secret', 'authorization', 'apiKey']
   */
  redactFields?: string[];

  /**
   * Replacement string for redacted values
   * @default '[REDACTED]'
   */
  redactionString?: string;

  /**
   * Whether to sanitize request bodies
   * @default true
   */
  sanitizeRequests?: boolean;

  /**
   * Whether to sanitize response bodies
   * @default false
   */
  sanitizeResponses?: boolean;

  /**
   * Whether to detect and mask PII (Personally Identifiable Information)
   * @default true
   */
  maskPII?: boolean;
}

/**
 * Journey-specific logging configuration
 */
export interface JourneyLoggingConfig {
  /**
   * Health journey specific logging configuration
   */
  health?: {
    /**
     * Minimum log level for health journey
     * @default LogLevel from root config
     */
    level?: LogLevel;

    /**
     * Additional context fields specific to health journey
     */
    context?: Record<string, any>;
  };

  /**
   * Care journey specific logging configuration
   */
  care?: {
    /**
     * Minimum log level for care journey
     * @default LogLevel from root config
     */
    level?: LogLevel;

    /**
     * Additional context fields specific to care journey
     */
    context?: Record<string, any>;
  };

  /**
   * Plan journey specific logging configuration
   */
  plan?: {
    /**
     * Minimum log level for plan journey
     * @default LogLevel from root config
     */
    level?: LogLevel;

    /**
     * Additional context fields specific to plan journey
     */
    context?: Record<string, any>;
  };
}

/**
 * Comprehensive configuration interface for the logging system
 */
export interface LoggerConfig {
  /**
   * Minimum log level
   * @default LogLevel.INFO in production, LogLevel.DEBUG in development
   */
  level?: LogLevel;

  /**
   * Service name for identification in logs
   */
  serviceName: string;

  /**
   * Application environment (development, staging, production)
   * @default process.env.NODE_ENV || 'development'
   */
  environment?: string;

  /**
   * Transport configurations
   * @default [{ type: TransportType.CONSOLE }] in development
   * @default [{ type: TransportType.CONSOLE }, { type: TransportType.CLOUDWATCH }] in production
   */
  transports?: TransportConfig[];

  /**
   * Default formatter type
   * @default FormatterType.TEXT in development, FormatterType.JSON in production
   */
  defaultFormatter?: FormatterType;

  /**
   * Default context values
   */
  contextDefaults?: ContextDefaults;

  /**
   * Trace correlation configuration
   */
  traceCorrelation?: TraceCorrelationConfig;

  /**
   * Sanitization configuration for sensitive data
   */
  sanitization?: SanitizationConfig;

  /**
   * Journey-specific logging configuration
   */
  journeys?: JourneyLoggingConfig;

  /**
   * Whether to include timestamps in logs
   * @default true
   */
  timestamp?: boolean;

  /**
   * Whether to exit on critical errors
   * @default false
   */
  exitOnError?: boolean;

  /**
   * Whether to silence all logs (useful for testing)
   * @default false
   */
  silent?: boolean;

  /**
   * Whether to include metadata about the log entry
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * Whether to handle uncaught exceptions
   * @default true
   */
  handleExceptions?: boolean;

  /**
   * Whether to handle unhandled promise rejections
   * @default true
   */
  handleRejections?: boolean;

  /**
   * Maximum size of the internal buffer before flushing
   * @default 1000
   */
  bufferSize?: number;

  /**
   * Interval in milliseconds to flush the buffer
   * @default 1000
   */
  flushInterval?: number;
}