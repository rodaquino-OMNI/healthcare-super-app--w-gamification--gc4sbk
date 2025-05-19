/**
 * @file Barrel file that exports all interfaces from the tracing package.
 * This file creates a centralized point for importing type definitions,
 * ensuring proper module resolution and type safety when consuming the tracing package.
 */

// Journey Context Interfaces
export {
  BaseJourneyContext,
  JourneyType,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
  GamificationContext,
  JourneyContext,
  TraceContext as JourneyTraceContext,
} from './journey-context.interface';

// Span Attributes Interfaces
export {
  SpanAttributes,
  HttpSpanAttributes,
  DatabaseSpanAttributes,
  MessagingSpanAttributes,
  JourneySpanAttributes,
  HealthJourneySpanAttributes,
  CareJourneySpanAttributes,
  PlanJourneySpanAttributes,
  GamificationSpanAttributes,
  ErrorSpanAttributes,
  // Constants
  JOURNEY_NAMES,
  DATABASE_SYSTEMS,
  MESSAGING_SYSTEMS,
  ERROR_TYPES,
  GAMIFICATION_EVENT_TYPES,
  // Helper functions
  createJourneyAttributes,
  createErrorAttributes,
} from './span-attributes.interface';

// Trace Context Interfaces
export {
  ContextCarrier,
  SerializedTraceContext,
  CreateTraceContextOptions,
  ExtractTraceContextOptions,
  InjectTraceContextOptions,
  TraceContext,
} from './trace-context.interface';

// Tracer Provider Interfaces
export {
  TracerOptions,
  TracerProvider,
} from './tracer-provider.interface';

// Span Options Interface
export {
  SpanOptions,
} from './span-options.interface';

// Tracing Options Interfaces
export {
  TracingOptions,
  ExporterOptions,
  SpanProcessorOptions,
} from './tracing-options.interface';