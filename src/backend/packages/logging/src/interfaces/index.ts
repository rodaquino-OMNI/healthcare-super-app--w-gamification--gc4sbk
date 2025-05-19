/**
 * @file Logging Interfaces Index
 * @description This barrel file exports all interfaces and types from the logging interfaces directory,
 * providing a clean, organized way to import logging interfaces throughout the AUSTA SuperApp.
 * 
 * This file simplifies imports by allowing consumers to import all interfaces from a single path,
 * preventing verbose import statements and potential circular dependencies.
 */

/**
 * @module @austa/logging/interfaces
 */

/**
 * LoggerConfig interface for configuring the logging system
 * Specifies all configuration options including log level, formatter selection,
 * transports, and context defaults
 */
export * from './log-config.interface';

/**
 * Transport interface that all log transport implementations must implement
 * Handles the actual writing of log entries to various destinations with methods
 * for initializing, writing logs, and managing the transport lifecycle
 */
export * from './transport.interface';

/**
 * LogEntry interface representing the structure of log entries
 * Includes all necessary fields for comprehensive logging: message, level,
 * timestamp, context, trace IDs, and journey information
 */
export * from './log-entry.interface';

/**
 * LogLevel enumeration standardizing log levels across the AUSTA SuperApp
 * Provides five standard log levels (DEBUG, INFO, WARN, ERROR, FATAL) with
 * utility functions for level comparison and string conversion
 */
export * from './log-level.enum';

/**
 * Extended Logger interface building upon NestJS's LoggerService
 * Adds support for journey context, user context, and request context
 * while maintaining compatibility with NestJS's core logging system
 */
export * from './logger.interface';