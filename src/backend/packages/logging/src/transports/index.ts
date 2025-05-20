/**
 * @file Barrel file that exports all transport implementations and the transport factory.
 * @module @austa/logging/transports
 */

// Re-export the Transport interface for convenience
import { Transport } from '../interfaces/transport.interface';

// Export all transport implementations
export { ConsoleTransport } from './console.transport';
export { FileTransport } from './file.transport';
export { CloudWatchTransport } from './cloudwatch.transport';

// Export the transport factory
export { TransportFactory } from './transport-factory';

// Re-export the Transport interface
export { Transport };

/**
 * @description This barrel file provides a clean way to import all logging transports
 * throughout the application. It exports all transport implementations, the transport
 * factory, and re-exports the Transport interface for convenience.
 * 
 * Example usage:
 * ```typescript
 * // Import specific transports
 * import { ConsoleTransport, FileTransport } from '@austa/logging/transports';
 * 
 * // Import the transport factory
 * import { TransportFactory } from '@austa/logging/transports';
 * 
 * // Import the Transport interface
 * import { Transport } from '@austa/logging/transports';
 * ```
 */