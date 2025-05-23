/**
 * @file Logging Interfaces Index
 * @description Exports all interfaces and types related to the logging system.
 * This barrel file provides a clean, organized way to import logging interfaces
 * throughout the AUSTA SuperApp backend services.
 *
 * @module @austa/logging/interfaces
 */

/**
 * Re-export all logging interfaces and types for convenient access.
 * This pattern allows consumers to import all logging-related types from a single path,
 * reducing import statements and preventing circular dependencies.
 */

// Configuration interfaces
export * from './log-config.interface';

// Core logging interfaces
export * from './logger.interface';
export * from './log-entry.interface';
export * from './transport.interface';

// Enums and types
export * from './log-level.enum';

/**
 * @example
 * // Import all logging interfaces
 * import { Logger, LogLevel, LogEntry, LoggerConfig, Transport } from '@austa/logging/interfaces';
 * 
 * // Configure a logger
 * const config: LoggerConfig = {
 *   level: LogLevel.INFO,
 *   transports: ['console', 'cloudwatch'],
 *   defaultContext: {
 *     service: 'auth-service',
 *     journey: 'auth'
 *   }
 * };
 */