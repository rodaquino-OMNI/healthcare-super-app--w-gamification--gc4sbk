/**
 * @austa/tracing
 * 
 * This package provides distributed tracing capabilities for the AUSTA SuperApp,
 * enabling end-to-end request tracing through all journey services. It integrates
 * with OpenTelemetry to provide standardized tracing across the application.
 * 
 * The tracing functionality allows:
 * - Tracking requests as they flow through different microservices
 * - Measuring performance at different stages of request processing
 * - Identifying bottlenecks and errors in the request pipeline
 * - Correlating logs and traces for better debugging
 * - Adding journey-specific context to traces for business insights
 */

// Re-export everything from the src directory
export * from './src';

// For backward compatibility and convenience, explicitly export the main components
export { TracingModule } from './src/tracing.module';
export { TracingService } from './src/tracing.service';

// Export interfaces
export * from './src/interfaces';

// Export utilities
export * from './src/utils';

// Export constants
export * from './src/constants';