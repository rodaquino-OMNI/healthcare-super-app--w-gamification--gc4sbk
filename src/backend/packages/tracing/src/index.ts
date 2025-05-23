/**
 * @austa/tracing
 * 
 * This package provides distributed tracing capabilities for the AUSTA SuperApp,
 * enabling end-to-end request visualization and performance monitoring across
 * all microservices and user journeys.
 * 
 * The package integrates OpenTelemetry for trace collection and propagation,
 * with support for journey-specific context and correlation with logs and metrics.
 */

// Export main module and service
export { TracingModule } from './tracing.module';
export { TracingService } from './tracing.service';

// Export all interfaces
export * from './interfaces';

// Export all constants
export * from './constants';

// Export all utility functions
export * from './utils';