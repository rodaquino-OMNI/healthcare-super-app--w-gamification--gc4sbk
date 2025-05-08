/**
 * @austa/tracing
 * 
 * This package provides distributed tracing capabilities for the AUSTA SuperApp,
 * enabling end-to-end request tracing across all journey services. It integrates
 * with OpenTelemetry to provide standardized tracing patterns and context propagation
 * mechanisms for the entire application.
 *
 * The package supports the following key features:
 * - Distributed tracing across microservices with trace context propagation
 * - Journey-specific span attributes for business context in traces
 * - Correlation between logs, traces, and metrics for unified observability
 * - Performance monitoring and bottleneck identification
 * - Error tracking with detailed context information
 *
 * @packageDocumentation
 */

// ========================================================================
// Core Components
// ========================================================================

/**
 * Primary module for NestJS integration that provides tracing capabilities.
 * This module should be imported in the root AppModule of each microservice.
 */
export { TracingModule } from './src/tracing.module';

/**
 * Injectable service that provides methods for creating and managing spans.
 * This service is the primary interface for instrumenting code with traces.
 */
export { TracingService } from './src/tracing.service';

// ========================================================================
// Interfaces
// ========================================================================

/**
 * Type definitions for tracing configuration, span options, and context management.
 * These interfaces provide type safety when working with the tracing system.
 */
export {
  // Core tracing interfaces
  TracingOptions,
  TracerProvider,
  TraceContext,
  
  // Span-related interfaces
  SpanOptions,
  SpanAttributes,
  
  // Journey-specific interfaces
  JourneyContext,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
} from './src/interfaces';

// ========================================================================
// Utilities
// ========================================================================

/**
 * Utility functions for span attribute management, context propagation,
 * and correlation between traces, logs, and metrics.
 */
export {
  // Correlation utilities
  getTraceId,
  getSpanId,
  enrichLogContext,
  createCorrelationInfo,
  
  // Span attribute utilities
  addCommonAttributes,
  addUserAttributes,
  addErrorAttributes,
  addJourneyAttributes,
  
  // Context propagation utilities
  extractTraceContext,
  injectTraceContext,
  propagateToKafka,
  extractFromKafka,
  serializeContext,
  deserializeContext,
} from './src/utils';

// ========================================================================
// Constants
// ========================================================================

/**
 * Constants for span attribute names, error codes, configuration keys,
 * and default values used throughout the tracing system.
 */
export {
  // Span attribute constants
  SPAN_ATTRIBUTE_USER_ID,
  SPAN_ATTRIBUTE_REQUEST_ID,
  SPAN_ATTRIBUTE_SERVICE_NAME,
  SPAN_ATTRIBUTE_JOURNEY_TYPE,
  SPAN_ATTRIBUTE_ERROR_TYPE,
  SPAN_ATTRIBUTE_ERROR_MESSAGE,
  
  // Journey-specific attribute constants
  HEALTH_JOURNEY_ATTRIBUTES,
  CARE_JOURNEY_ATTRIBUTES,
  PLAN_JOURNEY_ATTRIBUTES,
  
  // Error code constants
  ERROR_TRACER_INITIALIZATION,
  ERROR_SPAN_CREATION,
  ERROR_CONTEXT_PROPAGATION,
  
  // Configuration constants
  CONFIG_SERVICE_NAME,
  CONFIG_SAMPLING_RATE,
  CONFIG_EXPORTER_TYPE,
  
  // Default values
  DEFAULT_SERVICE_NAME,
  DEFAULT_SPAN_NAME,
  DEFAULT_LOGGER_CONTEXT,
} from './src/constants';