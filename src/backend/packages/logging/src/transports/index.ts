/**
 * @file Transport barrel file that exports all transport implementations and the transport factory.
 * This file provides a clean way to import logging transports throughout the application.
 * @module @austa/logging/transports
 */

// Export the Transport interface for consumers to implement custom transports
export { Transport } from '../interfaces/transport.interface';

// Export all transport implementations
export { ConsoleTransport } from './console.transport';
export { FileTransport } from './file.transport';
export { CloudWatchTransport } from './cloudwatch.transport';

// Export the transport factory for simplified transport creation
export { TransportFactory } from './transport-factory';

/**
 * Available transport types in the logging package.
 * Used for configuration and transport selection.
 */
export enum TransportType {
  /** Writes logs to the console with optional colorization */
  CONSOLE = 'console',
  /** Writes logs to local files with rotation support */
  FILE = 'file',
  /** Sends logs to AWS CloudWatch Logs */
  CLOUDWATCH = 'cloudwatch'
}