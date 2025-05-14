/**
 * @file Formatters Index
 * @description This barrel file exports all log formatter implementations and interfaces
 * for use throughout the logging package. This file enables clean imports and consistent
 * use of formatters across the codebase.
 */

/**
 * @module @austa/logging/formatters
 */

/**
 * Formatter interface that all log formatters must implement
 * Establishes a contract for transforming log entries into formatted output
 */
export * from './formatter.interface';

/**
 * JSON formatter that transforms log entries into structured JSON format
 * Ensures logs are machine-readable with all necessary context and metadata
 */
export * from './json.formatter';

/**
 * CloudWatch formatter that extends JSON formatter with AWS-specific optimizations
 * Ensures logs are properly formatted for CloudWatch Logs Insights queries
 */
export * from './cloudwatch.formatter';

/**
 * Text formatter that presents log entries in a human-readable format
 * Optimized for local development and debugging with colors and formatting
 */
export * from './text.formatter';