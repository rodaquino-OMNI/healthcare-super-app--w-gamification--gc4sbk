/**
 * Event Tracing Utilities
 * 
 * Provides integration with OpenTelemetry for distributed tracing of events across services.
 * This utility creates and manages trace spans for event publication, consumption, and processing,
 * enabling end-to-end visibility of event flows. It adds trace context to events and extracts
 * trace context when receiving events, maintaining the trace across service boundaries.
 */

import { trace, context, SpanStatusCode, SpanKind, Span, Context } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { BaseEvent } from '../interfaces/base-event.interface';
import { EventMetadata } from '../dto/event-metadata.dto';

// Constants for span attribute names
const EVENT_ATTRIBUTES = {
  EVENT_ID: 'event.id',
  EVENT_TYPE: 'event.type',
  EVENT_SOURCE: 'event.source',
  EVENT_VERSION: 'event.version',
  EVENT_JOURNEY: 'event.journey',
  USER_ID: 'event.user.id',
};

// Constants for journey-specific attributes
const JOURNEY_ATTRIBUTES = {
  HEALTH: {
    METRIC_TYPE: 'health.metric.type',
    GOAL_ID: 'health.goal.id',
    DEVICE_ID: 'health.device.id',
  },
  CARE: {
    APPOINTMENT_ID: 'care.appointment.id',
    MEDICATION_ID: 'care.medication.id',
    PROVIDER_ID: 'care.provider.id',
  },
  PLAN: {
    CLAIM_ID: 'plan.claim.id',
    BENEFIT_ID: 'plan.benefit.id',
    PLAN_ID: 'plan.id',
  },
};

/**
 * Creates a span for event publication and injects the trace context into the event metadata.
 * 
 * @param event The event being published
 * @param destination The destination (topic, queue, etc.) where the event is being published
 * @returns The event with trace context injected into its metadata
 */
export function traceEventPublication<T extends BaseEvent>(event: T, destination: string): T {
  const tracer = trace.getTracer('austa-events');
  
  return tracer.startActiveSpan(`publish_event_${event.type}`, { kind: SpanKind.PRODUCER }, (span) => {
    try {
      // Add common event attributes to the span
      addEventAttributesToSpan(span, event);
      
      // Add destination-specific attributes
      span.setAttribute('messaging.destination', destination);
      span.setAttribute('messaging.system', 'kafka');
      span.setAttribute('messaging.operation', 'publish');
      
      // Add journey-specific attributes if applicable
      addJourneyAttributesToSpan(span, event);
      
      // Inject trace context into event metadata
      const eventWithContext = injectTraceContext(event);
      
      span.setStatus({ code: SpanStatusCode.OK });
      return eventWithContext;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Creates a span for event consumption and extracts the trace context from the event metadata.
 * 
 * @param event The event being consumed
 * @param source The source (topic, queue, etc.) from which the event is being consumed
 * @returns The active context containing the extracted trace context
 */
export function traceEventConsumption<T extends BaseEvent>(event: T, source: string): Context {
  const tracer = trace.getTracer('austa-events');
  let extractedContext: Context = context.active();
  
  // Extract trace context from event metadata if available
  if (event.metadata?.traceContext) {
    extractedContext = extractTraceContext(event);
  }
  
  return context.with(extractedContext, () => {
    return tracer.startActiveSpan(`consume_event_${event.type}`, { kind: SpanKind.CONSUMER }, (span) => {
      try {
        // Add common event attributes to the span
        addEventAttributesToSpan(span, event);
        
        // Add source-specific attributes
        span.setAttribute('messaging.source', source);
        span.setAttribute('messaging.system', 'kafka');
        span.setAttribute('messaging.operation', 'consume');
        
        // Add journey-specific attributes if applicable
        addJourneyAttributesToSpan(span, event);
        
        span.setStatus({ code: SpanStatusCode.OK });
        return context.active();
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  });
}

/**
 * Creates a span for event processing within a service.
 * 
 * @param event The event being processed
 * @param handlerName The name of the handler processing the event
 * @param processingFn The function that processes the event
 * @returns The result of the processing function
 */
export async function traceEventProcessing<T extends BaseEvent, R>(
  event: T, 
  handlerName: string, 
  processingFn: () => Promise<R>
): Promise<R> {
  const tracer = trace.getTracer('austa-events');
  
  return tracer.startActiveSpan(`process_event_${event.type}`, { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      // Add common event attributes to the span
      addEventAttributesToSpan(span, event);
      
      // Add handler-specific attributes
      span.setAttribute('event.handler', handlerName);
      
      // Add journey-specific attributes if applicable
      addJourneyAttributesToSpan(span, event);
      
      // Execute the processing function
      const result = await processingFn();
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Injects the current trace context into an event's metadata.
 * 
 * @param event The event to inject trace context into
 * @returns The event with trace context injected into its metadata
 */
export function injectTraceContext<T extends BaseEvent>(event: T): T {
  const currentSpan = trace.getSpan(context.active());
  if (!currentSpan) {
    return event;
  }
  
  const spanContext = currentSpan.spanContext();
  
  // Create a copy of the event to avoid mutating the original
  const eventCopy = { ...event };
  
  // Initialize metadata if it doesn't exist
  if (!eventCopy.metadata) {
    eventCopy.metadata = {} as EventMetadata;
  }
  
  // Add trace context to metadata
  eventCopy.metadata.traceContext = {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
  };
  
  // Add correlation ID if not already present
  if (!eventCopy.metadata.correlationId) {
    eventCopy.metadata.correlationId = spanContext.traceId;
  }
  
  return eventCopy;
}

/**
 * Extracts trace context from an event's metadata and creates a new context with the extracted trace.
 * 
 * @param event The event containing trace context in its metadata
 * @returns A new context with the extracted trace context
 */
export function extractTraceContext<T extends BaseEvent>(event: T): Context {
  if (!event.metadata?.traceContext) {
    return context.active();
  }
  
  const { traceId, spanId, traceFlags } = event.metadata.traceContext;
  
  // Create a new context with the extracted trace context
  const spanContext = {
    traceId,
    spanId,
    traceFlags,
    isRemote: true,
  };
  
  // Set the extracted span context as the parent in the current context
  return trace.setSpanContext(context.active(), spanContext);
}

/**
 * Adds common event attributes to a span.
 * 
 * @param span The span to add attributes to
 * @param event The event containing the attributes
 */
function addEventAttributesToSpan<T extends BaseEvent>(span: Span, event: T): void {
  span.setAttribute(EVENT_ATTRIBUTES.EVENT_TYPE, event.type);
  
  if (event.eventId) {
    span.setAttribute(EVENT_ATTRIBUTES.EVENT_ID, event.eventId);
  }
  
  if (event.source) {
    span.setAttribute(EVENT_ATTRIBUTES.EVENT_SOURCE, event.source);
  }
  
  if (event.version) {
    span.setAttribute(EVENT_ATTRIBUTES.EVENT_VERSION, event.version);
  }
  
  if (event.userId) {
    span.setAttribute(EVENT_ATTRIBUTES.USER_ID, event.userId);
    span.setAttribute(SemanticAttributes.ENDUSER_ID, event.userId);
  }
  
  if (event.journey) {
    span.setAttribute(EVENT_ATTRIBUTES.EVENT_JOURNEY, event.journey);
  }
  
  // Add correlation ID if available in metadata
  if (event.metadata?.correlationId) {
    span.setAttribute('correlation.id', event.metadata.correlationId);
  }
}

/**
 * Adds journey-specific attributes to a span based on the event's journey and data.
 * 
 * @param span The span to add attributes to
 * @param event The event containing journey-specific data
 */
function addJourneyAttributesToSpan<T extends BaseEvent>(span: Span, event: T): void {
  if (!event.journey || !event.data) {
    return;
  }
  
  const data = event.data as Record<string, any>;
  
  switch (event.journey.toLowerCase()) {
    case 'health':
      if (data.metricType) {
        span.setAttribute(JOURNEY_ATTRIBUTES.HEALTH.METRIC_TYPE, data.metricType);
      }
      if (data.goalId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.HEALTH.GOAL_ID, data.goalId);
      }
      if (data.deviceId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.HEALTH.DEVICE_ID, data.deviceId);
      }
      break;
      
    case 'care':
      if (data.appointmentId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.CARE.APPOINTMENT_ID, data.appointmentId);
      }
      if (data.medicationId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.CARE.MEDICATION_ID, data.medicationId);
      }
      if (data.providerId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.CARE.PROVIDER_ID, data.providerId);
      }
      break;
      
    case 'plan':
      if (data.claimId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.PLAN.CLAIM_ID, data.claimId);
      }
      if (data.benefitId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.PLAN.BENEFIT_ID, data.benefitId);
      }
      if (data.planId) {
        span.setAttribute(JOURNEY_ATTRIBUTES.PLAN.PLAN_ID, data.planId);
      }
      break;
  }
}

/**
 * Creates a span for a batch of events being processed.
 * 
 * @param eventType The type of events in the batch
 * @param batchSize The number of events in the batch
 * @param processingFn The function that processes the batch of events
 * @returns The result of the processing function
 */
export async function traceBatchEventProcessing<R>(
  eventType: string,
  batchSize: number,
  processingFn: () => Promise<R>
): Promise<R> {
  const tracer = trace.getTracer('austa-events');
  
  return tracer.startActiveSpan(`process_batch_${eventType}`, { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      // Add batch-specific attributes
      span.setAttribute('event.batch.size', batchSize);
      span.setAttribute('event.type', eventType);
      
      // Execute the processing function
      const result = await processingFn();
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Creates a span for event validation.
 * 
 * @param event The event being validated
 * @param validatorName The name of the validator
 * @param validationFn The function that validates the event
 * @returns The result of the validation function
 */
export async function traceEventValidation<T extends BaseEvent, R>(
  event: T,
  validatorName: string,
  validationFn: () => Promise<R>
): Promise<R> {
  const tracer = trace.getTracer('austa-events');
  
  return tracer.startActiveSpan(`validate_event_${event.type}`, { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      // Add common event attributes to the span
      addEventAttributesToSpan(span, event);
      
      // Add validator-specific attributes
      span.setAttribute('event.validator', validatorName);
      
      // Execute the validation function
      const result = await validationFn();
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}