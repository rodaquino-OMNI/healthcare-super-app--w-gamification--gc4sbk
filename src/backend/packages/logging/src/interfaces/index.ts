/**
 * @file Logging Interfaces Index
 * @description Exports all interfaces and types for the AUSTA SuperApp logging system.
 * This barrel file provides a clean, organized way to import logging interfaces
 * throughout the application, simplifying imports and preventing circular dependencies.
 */

/**
 * Re-export all logging interfaces and types
 */
export * from './log-config.interface';
export * from './transport.interface';
export * from './log-level.enum';

/**
 * @module @austa/logging/interfaces
 * @description This module provides all interfaces and types for configuring and
 * extending the AUSTA SuperApp logging system. It includes configuration options,
 * transport definitions, and standardized log levels.
 *
 * @example
 * // Import all logging interfaces
 * import { LoggerConfig, Transport, LogLevel } from '@austa/logging/interfaces';
 *
 * // Create a logger configuration
 * const config: LoggerConfig = {
 *   level: LogLevel.INFO,
 *   transports: [...],
 *   journeyContext: true
 * };
 */