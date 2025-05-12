/**
 * @file event-tracing.ts
 * @description Provides integration with OpenTelemetry for distributed tracing of events across services.
 * This utility creates and manages trace spans for event publication, consumption, and processing,
 * enabling end-to-end visibility of event flows. It adds trace context to events and extracts trace
 * context when receiving events, maintaining the trace across service boundaries.
 */

import { Span, SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { TraceContext } from '../../../tracing/src/interfaces/trace-context.interface';
import { SpanOptions } from '../../../tracing/src/interfaces/span-options.interface';
import { JourneyContext } from '../../../tracing/src/interfaces/journey-context.interface';
import * as spanAttributes from '../../../tracing/src/utils/span-attributes';
import * as contextPropagation from '../../../tracing/src/utils/context-propagation';
import * as correlation from '../../../tracing/src/utils/correlation';
import { SPAN_ATTRIBUTES } from '../../../tracing/src/constants/span-attributes';

/**
 * Event tracing metadata keys used for context propagation
 */
export const EVENT_TRACE_CONTEXT_KEY = 'trace_context';
export const EVENT_CORRELATION_ID_KEY = 'correlation_id';

/**
 * Event operation types for span naming
 */
export enum EventOperation {
  PUBLISH = 'publish',
  CONSUME = 'consume',
  PROCESS = 'process',
}

/**
 * Interface for event tracing options
 */
export interface EventTracingOptions {
  /** The event type (e.g., 'user.created', 'appointment.scheduled') */
  eventType: string;
  /** The journey context (e.g., 'health', 'care', 'plan') */
  journey?: string;
  /** The messaging system being used (e.g., 'kafka', 'rabbitmq') */
  messagingSystem?: string;
  /** The topic or queue name */
  destination?: string;
  /** Additional attributes to add to the span */
  attributes?: Record<string, string | number | boolean>;
  /** Correlation ID for linking related operations */
  correlationId?: string;
}

/**
 * Creates a span for event publication operations.
 * 
 * @param options - The event tracing options
 * @returns A new span for the publish operation
 */
export function createPublishEventSpan(options: EventTracingOptions): Span {
  const { eventType, journey, messagingSystem = 'kafka', destination, attributes = {}, correlationId } = options;
  
  const spanName = `${messagingSystem}.${EventOperation.PUBLISH}.${eventType}`;
  
  const spanOptions: SpanOptions = {
    kind: SpanKind.PRODUCER,
    attributes: {
      [SemanticAttributes.MESSAGING_SYSTEM]: messagingSystem,
      [SemanticAttributes.MESSAGING_DESTINATION]: destination || eventType,
      [SemanticAttributes.MESSAGING_DESTINATION_KIND]: 'topic',
      [SPAN_ATTRIBUTES.EVENT_TYPE]: eventType,
      ...attributes,
    },
  };

  // Create the span
  const tracer = trace.getTracer('event-tracing');
  const span = tracer.startSpan(spanName, spanOptions);
  
  // Add journey-specific attributes if available
  if (journey) {
    addJourneyAttributes(span, journey);
  }
  
  // Add correlation ID if available
  if (correlationId) {
    span.setAttribute(SPAN_ATTRIBUTES.CORRELATION_ID, correlationId);
  }
  
  return span;
}

/**
 * Creates a span for event consumption operations.
 * 
 * @param options - The event tracing options
 * @param parentContext - Optional parent context to link this span to
 * @returns A new span for the consume operation
 */
export function createConsumeEventSpan(
  options: EventTracingOptions,
  parentContext?: TraceContext
): Span {
  const { eventType, journey, messagingSystem = 'kafka', destination, attributes = {}, correlationId } = options;
  
  const spanName = `${messagingSystem}.${EventOperation.CONSUME}.${eventType}`;
  
  const spanOptions: SpanOptions = {
    kind: SpanKind.CONSUMER,
    attributes: {
      [SemanticAttributes.MESSAGING_SYSTEM]: messagingSystem,
      [SemanticAttributes.MESSAGING_DESTINATION]: destination || eventType,
      [SemanticAttributes.MESSAGING_DESTINATION_KIND]: 'topic',
      [SPAN_ATTRIBUTES.EVENT_TYPE]: eventType,
      ...attributes,
    },
  };

  // If parent context is provided, set it as the parent
  if (parentContext) {
    spanOptions.parent = parentContext;
  }

  // Create the span
  const tracer = trace.getTracer('event-tracing');
  const span = tracer.startSpan(spanName, spanOptions);
  
  // Add journey-specific attributes if available
  if (journey) {
    addJourneyAttributes(span, journey);
  }
  
  // Add correlation ID if available
  if (correlationId) {
    span.setAttribute(SPAN_ATTRIBUTES.CORRELATION_ID, correlationId);
  }
  
  return span;
}

/**
 * Creates a span for event processing operations.
 * 
 * @param options - The event tracing options
 * @param parentContext - Optional parent context to link this span to
 * @returns A new span for the process operation
 */
export function createProcessEventSpan(
  options: EventTracingOptions,
  parentContext?: TraceContext
): Span {
  const { eventType, journey, attributes = {}, correlationId } = options;
  
  const spanName = `event.${EventOperation.PROCESS}.${eventType}`;
  
  const spanOptions: SpanOptions = {
    kind: SpanKind.INTERNAL,
    attributes: {
      [SPAN_ATTRIBUTES.EVENT_TYPE]: eventType,
      ...attributes,
    },
  };

  // If parent context is provided, set it as the parent
  if (parentContext) {
    spanOptions.parent = parentContext;
  }

  // Create the span
  const tracer = trace.getTracer('event-tracing');
  const span = tracer.startSpan(spanName, spanOptions);
  
  // Add journey-specific attributes if available
  if (journey) {
    addJourneyAttributes(span, journey);
  }
  
  // Add correlation ID if available
  if (correlationId) {
    span.setAttribute(SPAN_ATTRIBUTES.CORRELATION_ID, correlationId);
  }
  
  return span;
}

/**
 * Adds journey-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param journey - The journey identifier (e.g., 'health', 'care', 'plan')
 */
export function addJourneyAttributes(span: Span, journey: string): void {
  span.setAttribute(SPAN_ATTRIBUTES.JOURNEY, journey);
  
  // Add journey-specific attributes based on the journey type
  switch (journey.toLowerCase()) {
    case 'health':
      spanAttributes.addHealthJourneyAttributes(span, { journeyType: 'health' } as JourneyContext);
      break;
    case 'care':
      spanAttributes.addCareJourneyAttributes(span, { journeyType: 'care' } as JourneyContext);
      break;
    case 'plan':
      spanAttributes.addPlanJourneyAttributes(span, { journeyType: 'plan' } as JourneyContext);
      break;
    default:
      // For unknown journey types, just add the journey name
      break;
  }
}

/**
 * Injects trace context into an event object for propagation across service boundaries.
 * 
 * @param event - The event object to inject context into
 * @param span - The current span to extract context from
 * @returns The event with injected trace context
 */
export function injectTraceContext<T extends Record<string, any>>(event: T, span: Span): T {
  try {
    // Get the current context with the active span
    const currentContext = trace.setSpan(context.active(), span);
    
    // Extract the trace context
    const traceContext = contextPropagation.extractTraceContext(currentContext);
    
    // Get correlation ID from the span or generate a new one
    const correlationId = span.attributes[SPAN_ATTRIBUTES.CORRELATION_ID] as string || 
      correlation.generateCorrelationId();
    
    // Clone the event to avoid modifying the original
    const eventWithContext = { ...event };
    
    // Add metadata if it doesn't exist
    if (!eventWithContext.metadata) {
      eventWithContext.metadata = {};
    }
    
    // Inject the trace context and correlation ID
    eventWithContext.metadata[EVENT_TRACE_CONTEXT_KEY] = traceContext;
    eventWithContext.metadata[EVENT_CORRELATION_ID_KEY] = correlationId;
    
    return eventWithContext;
  } catch (error) {
    // If context injection fails, log the error but don't break the event flow
    console.error('Failed to inject trace context into event:', error);
    return event;
  }
}

/**
 * Extracts trace context from an event object.
 * 
 * @param event - The event object containing trace context
 * @returns The extracted trace context or undefined if not found
 */
export function extractTraceContext<T extends Record<string, any>>(
  event: T
): TraceContext | undefined {
  try {
    if (event?.metadata?.[EVENT_TRACE_CONTEXT_KEY]) {
      return event.metadata[EVENT_TRACE_CONTEXT_KEY] as TraceContext;
    }
    return undefined;
  } catch (error) {
    console.error('Failed to extract trace context from event:', error);
    return undefined;
  }
}

/**
 * Extracts correlation ID from an event object.
 * 
 * @param event - The event object containing correlation ID
 * @returns The extracted correlation ID or undefined if not found
 */
export function extractCorrelationId<T extends Record<string, any>>(
  event: T
): string | undefined {
  try {
    if (event?.metadata?.[EVENT_CORRELATION_ID_KEY]) {
      return event.metadata[EVENT_CORRELATION_ID_KEY] as string;
    }
    return undefined;
  } catch (error) {
    console.error('Failed to extract correlation ID from event:', error);
    return undefined;
  }
}

/**
 * Records an error in the current span and sets the span status to error.
 * 
 * @param span - The span to record the error in
 * @param error - The error to record
 */
export function recordEventError(span: Span, error: Error): void {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
}

/**
 * Executes a function within the context of an event processing span.
 * 
 * @param options - The event tracing options
 * @param fn - The function to execute within the span context
 * @returns The result of the function execution
 */
export async function withEventProcessing<T>(
  options: EventTracingOptions,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = createProcessEventSpan(options);
  
  try {
    // Set the current span as active for the duration of the function execution
    return await context.with(trace.setSpan(context.active(), span), async () => {
      return await fn(span);
    });
  } catch (error) {
    recordEventError(span, error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Executes a function within the context of an event publication span.
 * 
 * @param options - The event tracing options
 * @param fn - The function to execute within the span context
 * @returns The result of the function execution
 */
export async function withEventPublication<T>(
  options: EventTracingOptions,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = createPublishEventSpan(options);
  
  try {
    // Set the current span as active for the duration of the function execution
    return await context.with(trace.setSpan(context.active(), span), async () => {
      return await fn(span);
    });
  } catch (error) {
    recordEventError(span, error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Executes a function within the context of an event consumption span.
 * 
 * @param options - The event tracing options
 * @param parentContext - Optional parent context to link this span to
 * @param fn - The function to execute within the span context
 * @returns The result of the function execution
 */
export async function withEventConsumption<T>(
  options: EventTracingOptions,
  parentContext: TraceContext | undefined,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = createConsumeEventSpan(options, parentContext);
  
  try {
    // Set the current span as active for the duration of the function execution
    return await context.with(trace.setSpan(context.active(), span), async () => {
      return await fn(span);
    });
  } catch (error) {
    recordEventError(span, error as Error);
    throw error;
  } finally {
    span.end();
  }
}