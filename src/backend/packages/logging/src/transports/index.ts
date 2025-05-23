/**
 * @file Transport barrel file that exports all transport implementations and the transport factory.
 * @module @austa/logging/transports
 * @description This barrel file provides a clean way to import logging transports throughout the application.
 * It exports all transport implementations and the transport factory, allowing consumers to import
 * all transports from a single path.
 *
 * The logging transports are responsible for writing log entries to various destinations:
 * - ConsoleTransport: Writes logs to the console with colorization and formatting options
 * - FileTransport: Writes logs to files with rotation, compression, and retention options
 * - CloudWatchTransport: Sends logs to AWS CloudWatch Logs for centralized aggregation
 *
 * The TransportFactory provides a convenient way to create and configure transport instances
 * based on application configuration.
 *
 * @example
 * // Import specific transports
 * import { ConsoleTransport, FileTransport } from '@austa/logging/transports';
 *
 * // Import the transport factory
 * import { TransportFactory } from '@austa/logging/transports';
 *
 * // Create transports using the factory
 * const factory = new TransportFactory();
 * const transports = await factory.createTransports(configs, formatters);
 */

// Export all transport implementations
export * from './console.transport';
export * from './file.transport';
export * from './cloudwatch.transport';

// Export the transport factory and related types
export * from './transport-factory';

/**
 * @typedef {Object} TransportExports
 * @property {typeof import('./console.transport').ConsoleTransport} ConsoleTransport - Transport for console output
 * @property {typeof import('./file.transport').FileTransport} FileTransport - Transport for file-based logging
 * @property {typeof import('./cloudwatch.transport').CloudWatchTransport} CloudWatchTransport - Transport for AWS CloudWatch Logs
 * @property {typeof import('./transport-factory').TransportFactory} TransportFactory - Factory for creating transport instances
 * @property {typeof import('./transport-factory').TransportType} TransportType - Enum of supported transport types
 */

/**
 * @typedef {Object} TransportConfigExports
 * @property {typeof import('./transport-factory').TransportConfig} TransportConfig - Base configuration for all transports
 * @property {typeof import('./transport-factory').ConsoleTransportConfig} ConsoleTransportConfig - Configuration for console transport
 * @property {typeof import('./transport-factory').FileTransportConfig} FileTransportConfig - Configuration for file transport
 * @property {typeof import('./transport-factory').CloudWatchTransportConfig} CloudWatchTransportConfig - Configuration for CloudWatch transport
 * @property {typeof import('./transport-factory').AnyTransportConfig} AnyTransportConfig - Union type for all transport configurations
 */

/**
 * @typedef {Object} TransportOptionsExports
 * @property {typeof import('./console.transport').ConsoleTransportOptions} ConsoleTransportOptions - Options for console transport
 * @property {typeof import('./file.transport').FileTransportOptions} FileTransportOptions - Options for file transport
 * @property {typeof import('./cloudwatch.transport').CloudWatchTransportConfig} CloudWatchTransportConfig - Options for CloudWatch transport
 */