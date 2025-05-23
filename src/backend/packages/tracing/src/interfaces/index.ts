/**
 * @file index.ts
 * @description Barrel file that exports all interfaces from the tracing package,
 * creating a centralized point for importing type definitions.
 *
 * @module @austa/tracing/interfaces
 */

// Export all journey context interfaces
export * from './journey-context.interface';

// Export span attributes interface
export * from './span-attributes.interface';

// Export trace context interface
export * from './trace-context.interface';

// Export tracer provider interface
export * from './tracer-provider.interface';

// Export span options interface
export * from './span-options.interface';

// Export tracing options interface
export * from './tracing-options.interface';