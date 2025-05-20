/**
 * @file Formatters Module
 * @description Exports all log formatter implementations and interfaces for use throughout the logging package.
 * This module provides various formatters for transforming log entries into different output formats.
 */

/**
 * Core interfaces for log formatters and log entries
 */
export {
  Formatter,
  LogEntry,
  LogLevel,
  JourneyType
} from './formatter.interface';

/**
 * JSON formatter for structured logging
 * Transforms log entries into structured JSON format suitable for CloudWatch and other log aggregation systems.
 * This formatter ensures that logs are machine-readable and include all necessary context, metadata, and correlation IDs.
 * 
 * @example
 * ```typescript
 * const jsonFormatter = new JsonFormatter({ pretty: true });
 * const formattedLog = jsonFormatter.format(logEntry);
 * ```
 */
export { JsonFormatter } from './json.formatter';

/**
 * Text formatter for human-readable logs
 * Optimized for local development and debugging with colors, proper indentation, and clear visual separation.
 * 
 * @example
 * ```typescript
 * const textFormatter = new TextFormatter({ colors: true });
 * const formattedLog = textFormatter.format(logEntry);
 * ```
 */
export { TextFormatter, TextFormatterOptions } from './text.formatter';

/**
 * CloudWatch formatter for AWS CloudWatch Logs
 * Extends the JSON formatter with CloudWatch-specific optimizations for better querying and analysis in AWS.
 * 
 * @example
 * ```typescript
 * const cloudwatchFormatter = new CloudWatchFormatter();
 * const formattedLog = cloudwatchFormatter.format(logEntry);
 * ```
 */
export { CloudWatchFormatter } from './cloudwatch.formatter';

/**
 * Re-export LogLevelUtils for working with log levels
 */
export { LogLevelUtils, LogLevelString } from '../interfaces/log-level.enum';