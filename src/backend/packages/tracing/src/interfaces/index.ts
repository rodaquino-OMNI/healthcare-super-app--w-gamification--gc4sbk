/**
 * @file Barrel file that exports all interfaces from the tracing package.
 * This file creates a centralized point for importing type definitions,
 * ensuring proper module resolution and type safety when consuming the tracing package.
 */

// Export interfaces from trace-context.interface.ts
export { 
  TraceContext,
  JourneyContextInfo 
} from './trace-context.interface';

// Export interfaces from tracer-provider.interface.ts
export { 
  TracerProvider 
} from './tracer-provider.interface';