/**
 * @austa/tracing
 * 
 * This package provides distributed tracing capabilities for the AUSTA SuperApp,
 * enabling end-to-end request visualization and performance monitoring across
 * service boundaries. It integrates OpenTelemetry for automatic trace collection
 * and correlation with logs and metrics.
 *
 * The package supports:
 * - Automatic instrumentation of incoming and outgoing requests
 * - Custom span creation for business operations
 * - Correlation between traces, logs, and metrics
 * - Context propagation across service boundaries
 * - Journey-specific span attributes for health, care, and plan journeys
 *
 * @example
 * // Import and register the TracingModule in your NestJS application
 * import { TracingModule } from '@austa/tracing';
 *
 * @Module({
 *   imports: [
 *     TracingModule.forRoot({
 *       serviceName: 'health-service',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // Use the TracingService to create custom spans
 * import { TracingService } from '@austa/tracing';
 *
 * @Injectable()
 * export class HealthMetricsService {
 *   constructor(private readonly tracingService: TracingService) {}
 *
 *   async processHealthMetric(metric: HealthMetric): Promise<void> {
 *     const span = this.tracingService.startSpan('processHealthMetric');
 *     try {
 *       // Your business logic here
 *       span.setAttributes({
 *         'health.metric.type': metric.type,
 *         'health.metric.value': metric.value,
 *       });
 *     } catch (error) {
 *       span.recordException(error);
 *       throw error;
 *     } finally {
 *       span.end();
 *     }
 *   }
 * }
 */

/**
 * Core Module and Service
 * 
 * These are the primary components for integrating tracing into your application.
 * - TracingModule: NestJS module for configuring and registering tracing capabilities
 * - TracingService: Service for creating and managing spans in your application code
 */
export { TracingModule } from './tracing.module';
export { TracingService } from './tracing.service';

/**
 * Constants
 * 
 * Predefined values used throughout the tracing implementation.
 * Includes error codes, configuration keys, and default values.
 */
export * from './constants';

/**
 * Interfaces
 * 
 * Type definitions for the tracing package.
 * Includes interfaces for trace context, tracer provider, and configuration options.
 */
export * from './interfaces';

/**
 * Utilities
 * 
 * Helper functions for working with traces and spans.
 * Includes utilities for correlation, span attributes, and context propagation.
 */
export * from './utils';