/**
 * Barrel file that exports all mock implementations for the tracing module.
 * 
 * This file simplifies test setup by providing a single import point for all
 * tracing-related mocks, reducing the number of import statements needed in tests.
 * 
 * @example
 * // Instead of multiple imports:
 * // import { MockLoggerService } from './mock-logger.service';
 * // import { MockTracer } from './mock-tracer';
 * 
 * // Use a single import:
 * import { MockLoggerService, MockTracer } from '@austa/tracing/test/mocks';
 */

export * from './mock-logger.service';
export * from './mock-tracer';