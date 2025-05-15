/**
 * @austa/tracing
 * 
 * This package provides distributed tracing capabilities for the AUSTA SuperApp,
 * enabling end-to-end request visualization and performance monitoring across
 * service boundaries. It integrates OpenTelemetry to provide consistent tracing
 * across all journey services (Health, Care, Plan) and supports correlation with
 * logs and metrics for unified observability.
 *
 * @example
 * // Basic usage in a NestJS module
 * import { Module } from '@nestjs/common';
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
 * // Using the tracing service to create spans
 * import { Injectable } from '@nestjs/common';
 * import { TracingService } from '@austa/tracing';
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly tracingService: TracingService) {}
 * 
 *   async getUserProfile(userId: string) {
 *     return this.tracingService.startActiveSpan(
 *       'UserService.getUserProfile',
 *       async (span) => {
 *         // Add relevant attributes to the span
 *         span.setAttributes({
 *           'user.id': userId,
 *         });
 * 
 *         try {
 *           // Your business logic here
 *           const result = await this.fetchUserData(userId);
 *           return result;
 *         } catch (error) {
 *           // Record error in the span
 *           span.recordException(error);
 *           throw error;
 *         }
 *       }
 *     );
 *   }
 * }
 *
 * @packageDocumentation
 */

/**
 * Core Module and Service
 * 
 * These are the primary components for integrating tracing into NestJS applications.
 * Most consumers will only need to import TracingModule and use TracingService.
 * 
 * @example
 * // Initialize tracing in your NestJS application
 * import { TracingModule } from '@austa/tracing';
 * 
 * @Module({
 *   imports: [
 *     TracingModule.forRoot({
 *       serviceName: 'health-service',
 *       samplingRatio: 1.0, // Sample all requests
 *     }),
 *   ],
 * })
 */
export { TracingModule } from './tracing.module';

/**
 * The TracingService provides methods to create and manage spans for tracing operations.
 * Inject this service into your components to add tracing capabilities.
 * 
 * @example
 * // Create a traced operation
 * import { TracingService } from '@austa/tracing';
 * 
 * @Injectable()
 * class ExampleService {
 *   constructor(private readonly tracingService: TracingService) {}
 * 
 *   async performOperation() {
 *     return this.tracingService.startActiveSpan('operation', async (span) => {
 *       // Your code here
 *       return result;
 *     });
 *   }
 * }
 */
export { TracingService } from './tracing.service';

/**
 * Key Interfaces
 * 
 * Type definitions for tracing configuration, span options, and context propagation.
 * These interfaces enable type-safe usage of the tracing package and support
 * journey-specific tracing context.
 */
// Re-export specific interfaces for better discoverability
export { 
  /**
   * Configuration options for the TracingModule
   */
  TracingOptions,
  
  /**
   * Options for creating and configuring spans
   */
  SpanOptions,
  
  /**
   * Interface for managing trace context across service boundaries
   */
  TraceContext,
  
  /**
   * Interface for the underlying tracer provider implementation
   */
  TracerProvider,
  
  /**
   * Base interface for journey-specific tracing context
   */
  JourneyContext,
  
  /**
   * Tracing context specific to the Health journey
   */
  HealthJourneyContext,
  
  /**
   * Tracing context specific to the Care journey
   */
  CareJourneyContext,
  
  /**
   * Tracing context specific to the Plan journey
   */
  PlanJourneyContext,
  
  /**
   * Interface for standardized span attributes
   */
  SpanAttributes
} from './interfaces';

// Export all other interfaces
export * from './interfaces';

/**
 * Constants
 * 
 * Predefined values for span attributes, error codes, and configuration keys.
 * These constants ensure consistent naming and behavior across all services.
 */
// Re-export important constant groups for better discoverability
export { 
  /**
   * Error codes for tracing operations
   */
  ERROR_CODES,
  
  /**
   * Standard attribute keys for spans
   */
  SPAN_ATTRIBUTE_KEYS,
  
  /**
   * Configuration keys for tracing settings
   */
  CONFIG_KEYS,
  
  /**
   * Default values for tracing configuration
   */
  DEFAULT_VALUES
} from './constants';

// Export all other constants
export * from './constants';

/**
 * Utility Functions
 * 
 * Helper functions for common tracing operations such as context propagation,
 * span attribute management, and correlation with logs and metrics.
 */
// Re-export key utility functions for better discoverability
export {
  /**
   * Extracts the trace ID from the current context
   * @returns The current trace ID or undefined if not available
   * 
   * @example
   * import { getTraceIdFromContext } from '@austa/tracing';
   * 
   * const traceId = getTraceIdFromContext();
   * console.log(`Current trace ID: ${traceId}`);
   */
  getTraceIdFromContext,
  
  /**
   * Extracts the span ID from the current context
   * @returns The current span ID or undefined if not available
   */
  getSpanIdFromContext,
  
  /**
   * Enriches a log context object with trace information
   * @param logContext The log context to enrich
   * @returns The enriched log context with trace and span IDs
   * 
   * @example
   * import { enrichLogContextWithTraceInfo } from '@austa/tracing';
   * import { Logger } from '@nestjs/common';
   * 
   * const logger = new Logger('MyService');
   * const logContext = enrichLogContextWithTraceInfo({ userId: '123' });
   * logger.log('User action', logContext);
   */
  enrichLogContextWithTraceInfo,
  
  /**
   * Adds common attributes to a span (user ID, request ID, etc.)
   * @param span The span to add attributes to
   * @param attributes The attributes to add
   */
  addCommonAttributes,
  
  /**
   * Adds journey-specific attributes to a span
   * @param span The span to add attributes to
   * @param journeyContext The journey context containing attributes
   */
  addJourneyAttributes,
  
  /**
   * Adds error information to a span
   * @param span The span to add error attributes to
   * @param error The error to record
   */
  addErrorAttributes,
  
  /**
   * Extracts trace context from HTTP headers
   * @param headers The HTTP headers containing trace context
   * @returns The extracted trace context
   */
  extractTraceContextFromHeaders,
  
  /**
   * Injects trace context into HTTP headers
   * @param headers The HTTP headers to inject trace context into
   * @returns The headers with trace context
   * 
   * @example
   * import { injectTraceContextIntoHeaders } from '@austa/tracing';
   * import { HttpService } from '@nestjs/axios';
   * 
   * @Injectable()
   * class ApiClient {
   *   constructor(private readonly httpService: HttpService) {}
   * 
   *   async makeRequest(url: string) {
   *     const headers = {};
   *     injectTraceContextIntoHeaders(headers);
   *     return this.httpService.get(url, { headers }).toPromise();
   *   }
   * }
   */
  injectTraceContextIntoHeaders,
  
  /**
   * Extracts trace context from a Kafka message
   * @param message The Kafka message containing trace context
   * @returns The extracted trace context
   */
  extractTraceContextFromKafkaMessage,
  
  /**
   * Injects trace context into a Kafka message
   * @param message The Kafka message to inject trace context into
   * @returns The message with trace context
   */
  injectTraceContextIntoKafkaMessage
} from './utils';

// Export all other utilities
export * from './utils';