/**
 * @file index.ts
 * @description Barrel file that exports all interfaces from the tracing package,
 * creating a centralized point for importing type definitions. This file ensures
 * proper module resolution and type safety when consuming the tracing package.
 *
 * @module @austa/tracing/interfaces
 */

// Export journey context interfaces
export {
  JourneyContext,
  JourneyType,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
  GamificationContext,
  HealthJourneyWithGamification,
  CareJourneyWithGamification,
  PlanJourneyWithGamification,
  createJourneyContext
} from './journey-context.interface';

// Export span attributes interfaces and constants
export {
  SpanAttributes,
  HttpSpanAttributes,
  DatabaseSpanAttributes,
  MessagingSpanAttributes,
  UserSessionSpanAttributes,
  JourneySpanAttributes,
  HealthJourneySpanAttributes,
  CareJourneySpanAttributes,
  PlanJourneySpanAttributes,
  GamificationSpanAttributes,
  ErrorSpanAttributes,
  ExternalServiceSpanAttributes,
  // Constants
  JOURNEY_TYPES,
  JOURNEY_STEP_STATUS,
  GAMIFICATION_EVENT_TYPES,
  ERROR_CATEGORIES,
  DB_SYSTEMS,
  MESSAGING_SYSTEMS,
  HTTP_METHODS,
  NETWORK_TYPES,
  DEVICE_TYPES,
  HEALTH_METRIC_TYPES,
  HEALTH_METRIC_UNITS,
  CARE_APPOINTMENT_TYPES,
  CARE_APPOINTMENT_STATUSES,
  PLAN_TYPES,
  CLAIM_STATUSES
} from './span-attributes.interface';

// Export trace context interfaces and constants
export {
  TraceContext,
  PropagationFormat,
  HttpTraceContextCarrier,
  KafkaTraceContextCarrier,
  TRACE_CONTEXT_KEYS,
  TRACE_CONTEXT_ATTRIBUTES
} from './trace-context.interface';

// Export tracer provider interfaces
export {
  TracerProvider,
  TracerProviderOptions
} from './tracer-provider.interface';

// Export span options interface
export {
  SpanOptions
} from './span-options.interface';

// Export tracing options interface
export {
  TracingOptions
} from './tracing-options.interface';