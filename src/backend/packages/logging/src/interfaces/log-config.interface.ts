/**
 * @file log-config.interface.ts
 * @description Defines the configuration interface for the AUSTA SuperApp logging system.
 * This interface provides a comprehensive and type-safe way to configure all aspects
 * of the logging system, including log levels, formatters, transports, and context defaults.
 */

import { LogLevel } from './log-level.enum';

/**
 * Supported log formatter types
 */
export enum FormatterType {
  JSON = 'json',
  TEXT = 'text',
  CLOUDWATCH = 'cloudwatch',
}

/**
 * Supported log transport types
 */
export enum TransportType {
  CONSOLE = 'console',
  FILE = 'file',
  CLOUDWATCH = 'cloudwatch',
}

/**
 * Configuration options for the console transport
 */
export interface ConsoleTransportConfig {
  /**
   * Whether to use colors in console output
   * @default true
   */
  colorize?: boolean;

  /**
   * Whether to pretty-print objects in console output
   * @default true
   */
  prettyPrint?: boolean;

  /**
   * Whether to include timestamps in console output
   * @default true
   */
  timestamp?: boolean;
}

/**
 * Configuration options for the file transport
 */
export interface FileTransportConfig {
  /**
   * Path to the log file
   * @required
   */
  filename: string;

  /**
   * Maximum size of log files before rotation (in bytes)
   * @default 10485760 (10MB)
   */
  maxSize?: number;

  /**
   * Maximum number of log files to keep
   * @default 5
   */
  maxFiles?: number;

  /**
   * Whether to compress rotated log files
   * @default true
   */
  compress?: boolean;

  /**
   * Whether to append to existing log files
   * @default true
   */
  append?: boolean;
}

/**
 * Configuration options for the CloudWatch transport
 */
export interface CloudWatchTransportConfig {
  /**
   * AWS region for CloudWatch Logs
   * @required
   */
  region: string;

  /**
   * CloudWatch log group name
   * @required
   */
  logGroupName: string;

  /**
   * CloudWatch log stream name
   * @default Automatically generated based on service name and environment
   */
  logStreamName?: string;

  /**
   * Number of retries for failed CloudWatch API calls
   * @default 3
   */
  retries?: number;

  /**
   * Batch size for CloudWatch API calls
   * @default 10000
   */
  batchSize?: number;

  /**
   * Interval in milliseconds to flush logs to CloudWatch
   * @default 1000
   */
  flushInterval?: number;

  /**
   * AWS credentials configuration
   */
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    profile?: string;
  };
}

/**
 * Configuration for a single transport
 */
export interface TransportConfig {
  /**
   * Transport type
   * @required
   */
  type: TransportType;

  /**
   * Minimum log level for this transport
   * @default LogLevel from parent configuration
   */
  level?: LogLevel;

  /**
   * Formatter to use for this transport
   * @default FormatterType from parent configuration
   */
  formatter?: FormatterType;

  /**
   * Console transport specific configuration
   * Only used when type is TransportType.CONSOLE
   */
  console?: ConsoleTransportConfig;

  /**
   * File transport specific configuration
   * Only used when type is TransportType.FILE
   */
  file?: FileTransportConfig;

  /**
   * CloudWatch transport specific configuration
   * Only used when type is TransportType.CLOUDWATCH
   */
  cloudWatch?: CloudWatchTransportConfig;
}

/**
 * Configuration for journey-specific logging
 */
export interface JourneyLogConfig {
  /**
   * Minimum log level for this journey
   * @default LogLevel from parent configuration
   */
  level?: LogLevel;

  /**
   * Additional context fields to include in logs for this journey
   */
  context?: Record<string, any>;

  /**
   * Journey-specific transports
   * @default Transports from parent configuration
   */
  transports?: TransportConfig[];
}

/**
 * Default context values for logs
 */
export interface LogContextDefaults {
  /**
   * Application name
   * @default 'austa-superapp'
   */
  application?: string;

  /**
   * Service name
   * @default Derived from package.json
   */
  service?: string;

  /**
   * Environment name (development, staging, production)
   * @default 'development'
   */
  environment?: string;

  /**
   * Version of the application
   * @default Derived from package.json
   */
  version?: string;

  /**
   * Additional context fields to include in all logs
   */
  additional?: Record<string, any>;
}

/**
 * Main configuration interface for the logger
 */
export interface LoggerConfig {
  /**
   * Minimum log level
   * @default LogLevel.INFO
   */
  level?: LogLevel;

  /**
   * Default formatter to use
   * @default FormatterType.JSON in production, FormatterType.TEXT otherwise
   */
  formatter?: FormatterType;

  /**
   * Log transports configuration
   * @default [{ type: TransportType.CONSOLE }] in development
   * @default [{ type: TransportType.CONSOLE }, { type: TransportType.CLOUDWATCH }] in production
   */
  transports?: TransportConfig[];

  /**
   * Default context values for all logs
   */
  context?: LogContextDefaults;

  /**
   * Journey-specific logging configuration
   */
  journeys?: {
    /**
     * Health journey logging configuration
     */
    health?: JourneyLogConfig;

    /**
     * Care journey logging configuration
     */
    care?: JourneyLogConfig;

    /**
     * Plan journey logging configuration
     */
    plan?: JourneyLogConfig;
  };

  /**
   * Whether to include trace IDs in logs for distributed tracing
   * @default true
   */
  enableTracing?: boolean;

  /**
   * Whether to redact sensitive information in logs
   * @default true
   */
  redactSensitiveData?: boolean;

  /**
   * List of field names to redact in logs
   * @default ['password', 'token', 'secret', 'authorization', 'cookie']
   */
  sensitiveFields?: string[];

  /**
   * Maximum depth for object serialization
   * @default 5
   */
  maxObjectDepth?: number;

  /**
   * Whether to handle uncaught exceptions and unhandled rejections
   * @default true
   */
  handleExceptions?: boolean;

  /**
   * Whether to exit process after logging uncaught exceptions
   * @default true in production, false otherwise
   */
  exitOnError?: boolean;

  /**
   * Whether to silence logs during tests
   * @default true
   */
  silent?: boolean;
}