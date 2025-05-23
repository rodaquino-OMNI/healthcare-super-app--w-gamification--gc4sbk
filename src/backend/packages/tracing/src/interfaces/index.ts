/**
 * @file index.ts
 * @description Barrel file that exports all interfaces from the tracing package,
 * creating a centralized point for importing type definitions.
 *
 * @module @austa/tracing/interfaces
 */

// Export all journey context interfaces
export * from './journey-context.interface';

// Export other interfaces as they are created
// export * from './span-attributes.interface';
// export * from './trace-context.interface';
// export * from './tracer-provider.interface';
// export * from './span-options.interface';
// export * from './tracing-options.interface';