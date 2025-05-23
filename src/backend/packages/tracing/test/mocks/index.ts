/**
 * @file Barrel file that exports all mock implementations for the tracing package.
 * 
 * This file simplifies test setup by providing a single import point for all
 * tracing-related mocks. Without this file, developers would need to import
 * each mock individually, making test setup more verbose and error-prone.
 *
 * @example
 * // Import all mocks from a single location
 * import { MockTracingService, MockSpan } from '@austa/tracing/test/mocks';
 */

// Export all mock implementations
export * from './mock-tracing.service';
export * from './mock-logger.service';
export * from './mock-config.service';
export * from './mock-context';
export * from './mock-span';
export * from './mock-tracer';