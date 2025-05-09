/**
 * @file event-tracing.ts
 * @description Provides integration with OpenTelemetry for distributed tracing of events across services.
 * This utility creates and manages trace spans for event publication, consumption, and processing,
 * enabling end-to-end visibility of event flows. It adds trace context to events and extracts trace
 * context when receiving events, maintaining the trace across service boundaries.
 *
 * Key features:
 * - Distributed tracing across all AUSTA SuperApp services
 * - Journey-specific span attributes for improved filtering and analysis
 * - Integration with correlation IDs for complete request tracing
 * - Audit logging capabilities for compliance requirements
 * - Error tracking with detailed context information
 */

import { trace, context, SpanStatusCode, Span, SpanKind, Context, propagation, ROOT_CONTEXT } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { LoggerService } from '@nestjs/common';

/**
 * Constants for trace attribute names to ensure consistency across services
 */
export const TRACE_ATTRIBUTES = {
  // Event attributes
  EVENT_ID: 'event.id',
  EVENT_TYPE: 'event.type',
  EVENT_SOURCE: 'event.source',
  EVENT_VERSION: 'event.version',
  
  // Journey attributes
  JOURNEY_TYPE: 'journey.type',
  JOURNEY_ID: 'journey.id',
  
  // Kafka attributes
  KAFKA_TOPIC: 'messaging.kafka.topic',
  KAFKA_PARTITION: 'messaging.kafka.partition',
  KAFKA_MESSAGE_KEY: 'messaging.kafka.message_key',
  
  // User attributes
  USER_ID: 'user.id',
  
  // Correlation attributes
  CORRELATION_ID: 'correlation.id',
  
  // Processing attributes
  PROCESSING_RESULT: 'processing.result',
  PROCESSING_ERROR: 'processing.error',
  RETRY_COUNT: 'processing.retry_count',
  
  // Audit attributes
  AUDIT_ACTION: 'audit.action',
  AUDIT_RESOURCE: 'audit.resource',
  AUDIT_OUTCOME: 'audit.outcome',
  AUDIT_ACTOR: 'audit.actor',
  AUDIT_TARGET: 'audit.target',
  AUDIT_TIMESTAMP: 'audit.timestamp',
  
  // Compliance attributes
  COMPLIANCE_CATEGORY: 'compliance.category',
  COMPLIANCE_REQUIREMENT: 'compliance.requirement',
  COMPLIANCE_SENSITIVITY: 'compliance.data_sensitivity',
};

/**
 * Enum for journey types to ensure consistent naming
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
}

/**
 * Interface for trace context that can be injected into events
 */
export interface TraceContext {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Interface for audit log information
 */
export interface AuditInfo {
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
  actor?: string;
  target?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Interface for compliance information
 */
export interface ComplianceInfo {
  category: 'PHI' | 'PII' | 'FINANCIAL' | 'GENERAL';
  requirement?: string;
  dataSensitivity: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Options for creating event spans
 */
export interface EventSpanOptions {
  eventType: string;
  eventId?: string;
  userId?: string;
  journeyType?: JourneyType;
  journeyId?: string;
  correlationId?: string;
  source?: string;
  version?: string;
  attributes?: Record<string, unknown>;
  parentContext?: Context;
  auditInfo?: AuditInfo;
  complianceInfo?: ComplianceInfo;
}

/**
 * Creates a span for event publication
 * 
 * @param options - Options for creating the span
 * @returns A new span for the event publication
 */
export function createEventPublishSpan(options: EventSpanOptions): Span {
  const {
    eventType,
    eventId = uuidv4(),
    userId,
    journeyType,
    journeyId,
    correlationId = uuidv4(),
    source,
    version,
    attributes = {},
    parentContext = context.active(),
    auditInfo,
    complianceInfo,
  } = options;
  
  const spanName = `publish.event.${eventType}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: SpanKind.PRODUCER,
      attributes: {
        [TRACE_ATTRIBUTES.EVENT_ID]: eventId,
        [TRACE_ATTRIBUTES.EVENT_TYPE]: eventType,
        [TRACE_ATTRIBUTES.CORRELATION_ID]: correlationId,
        ...buildCommonAttributes(userId, journeyType, journeyId, source, version),
        ...attributes,
      },
    },
    parentContext,
  );
  
  // Add audit information if provided
  if (auditInfo) {
    span.setAttributes(buildAuditAttributes(auditInfo));
  }
  
  // Add compliance information if provided
  if (complianceInfo) {
    addComplianceInfo(span, complianceInfo);
  }
  
  return span;
}

/**
 * Creates a span for event consumption
 * 
 * @param options - Options for creating the span
 * @returns A new span for the event consumption
 */
export function createEventConsumeSpan(options: EventSpanOptions): Span {
  const {
    eventType,
    eventId = uuidv4(),
    userId,
    journeyType,
    journeyId,
    correlationId = uuidv4(),
    source,
    version,
    attributes = {},
    parentContext = context.active(),
    auditInfo,
    complianceInfo,
  } = options;
  
  const spanName = `consume.event.${eventType}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: SpanKind.CONSUMER,
      attributes: {
        [TRACE_ATTRIBUTES.EVENT_ID]: eventId,
        [TRACE_ATTRIBUTES.EVENT_TYPE]: eventType,
        [TRACE_ATTRIBUTES.CORRELATION_ID]: correlationId,
        ...buildCommonAttributes(userId, journeyType, journeyId, source, version),
        ...attributes,
      },
    },
    parentContext,
  );
  
  // Add audit information if provided
  if (auditInfo) {
    span.setAttributes(buildAuditAttributes(auditInfo));
  }
  
  // Add compliance information if provided
  if (complianceInfo) {
    addComplianceInfo(span, complianceInfo);
  }
  
  return span;
}

/**
 * Creates a span for event processing
 * 
 * @param options - Options for creating the span
 * @returns A new span for the event processing
 */
export function createEventProcessSpan(options: EventSpanOptions): Span {
  const {
    eventType,
    eventId = uuidv4(),
    userId,
    journeyType,
    journeyId,
    correlationId = uuidv4(),
    source,
    version,
    attributes = {},
    parentContext = context.active(),
    auditInfo,
    complianceInfo,
  } = options;
  
  const spanName = `process.event.${eventType}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        [TRACE_ATTRIBUTES.EVENT_ID]: eventId,
        [TRACE_ATTRIBUTES.EVENT_TYPE]: eventType,
        [TRACE_ATTRIBUTES.CORRELATION_ID]: correlationId,
        ...buildCommonAttributes(userId, journeyType, journeyId, source, version),
        ...attributes,
      },
    },
    parentContext,
  );
  
  // Add audit information if provided
  if (auditInfo) {
    span.setAttributes(buildAuditAttributes(auditInfo));
  }
  
  // Add compliance information if provided
  if (complianceInfo) {
    addComplianceInfo(span, complianceInfo);
  }
  
  return span;
}

/**
 * Executes a function within the context of an event publish span
 * 
 * @param options - Options for creating the span
 * @param fn - The function to execute within the span context
 * @returns The result of the function execution
 */
export async function withEventPublishSpan<T>(
  options: EventSpanOptions,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const span = createEventPublishSpan(options);
  
  try {
    const result = await trace.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Executes a function within the context of an event consume span
 * 
 * @param options - Options for creating the span
 * @param fn - The function to execute within the span context
 * @returns The result of the function execution
 */
export async function withEventConsumeSpan<T>(
  options: EventSpanOptions,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const span = createEventConsumeSpan(options);
  
  try {
    const result = await trace.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Executes a function within the context of an event process span
 * 
 * @param options - Options for creating the span
 * @param fn - The function to execute within the span context
 * @returns The result of the function execution
 */
export async function withEventProcessSpan<T>(
  options: EventSpanOptions,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const span = createEventProcessSpan(options);
  
  try {
    const result = await trace.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Traces the complete lifecycle of an event through publication, consumption, and processing
 * 
 * @param event - The event to trace
 * @param processFunction - The function to process the event
 * @param logger - Optional logger for additional logging
 * @returns The result of the processing function
 */
export async function traceEventLifecycle<T>(
  event: IBaseEvent,
  processFunction: (event: IBaseEvent) => Promise<T>,
  logger?: LoggerService,
): Promise<T> {
  // Ensure the event has metadata and trace context
  if (!event.metadata) {
    event.metadata = {};
  }
  
  if (!event.metadata.correlationId) {
    event.metadata.correlationId = uuidv4();
  }
  
  // Create a publish span
  const publishSpan = createSpanForEvent(event, 'publish');
  
  try {
    // Log the event publication if logger is provided
    if (logger) {
      logger.log(
        `Publishing event: ${event.type} (${event.eventId}) with correlation ID: ${event.metadata.correlationId}`,
        'EventTracing',
      );
    }
    
    // Inject trace context into the event
    injectTraceContext(event, trace.setSpan(context.active(), publishSpan));
    
    // End the publish span
    publishSpan.setStatus({ code: SpanStatusCode.OK });
    publishSpan.end();
    
    // Create a consume span
    const consumeSpan = createSpanForEvent(event, 'consume');
    
    try {
      // Log the event consumption if logger is provided
      if (logger) {
        logger.log(
          `Consuming event: ${event.type} (${event.eventId}) with correlation ID: ${event.metadata.correlationId}`,
          'EventTracing',
        );
      }
      
      // End the consume span
      consumeSpan.setStatus({ code: SpanStatusCode.OK });
      consumeSpan.end();
      
      // Create a process span
      const processSpan = createSpanForEvent(event, 'process');
      
      try {
        // Process the event within the process span context
        const result = await trace.with(
          trace.setSpan(context.active(), processSpan),
          () => processFunction(event),
        );
        
        // Log the event processing success if logger is provided
        if (logger) {
          logger.log(
            `Successfully processed event: ${event.type} (${event.eventId})`,
            'EventTracing',
          );
        }
        
        // Set the process span status to OK
        processSpan.setStatus({ code: SpanStatusCode.OK });
        
        return result;
      } catch (error) {
        // Log the event processing error if logger is provided
        if (logger) {
          logger.error(
            `Error processing event: ${event.type} (${event.eventId})`,
            error.stack,
            'EventTracing',
          );
        }
        
        // Record the exception and set the process span status to ERROR
        processSpan.recordException(error);
        processSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        
        throw error;
      } finally {
        // Always end the process span
        processSpan.end();
      }
    } catch (error) {
      // Record the exception and set the consume span status to ERROR
      consumeSpan.recordException(error);
      consumeSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      
      throw error;
    }
  } catch (error) {
    // Record the exception and set the publish span status to ERROR
    publishSpan.recordException(error);
    publishSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    
    throw error;
  }
}

/**
 * Injects trace context into an event
 * 
 * @param event - The event to inject trace context into
 * @param ctx - Optional context to use (defaults to active context)
 * @returns The event with trace context injected
 */
export function injectTraceContext<T extends IBaseEvent>(event: T, ctx: Context = context.active()): T {
  if (!event.metadata) {
    event.metadata = {};
  }
  
  if (!event.metadata.traceContext) {
    event.metadata.traceContext = {};
  }
  
  // Extract the current span from the context
  const currentSpan = trace.getSpan(ctx);
  if (!currentSpan) {
    return event;
  }
  
  // Get the current span context
  const spanContext = currentSpan.spanContext();
  
  // Create a carrier object for the trace context
  const traceContext: TraceContext = {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    correlationId: event.metadata.correlationId || uuidv4(),
  };
  
  // Use OpenTelemetry propagation API to inject context
  const carrier: Record<string, string> = {};
  propagation.inject(ctx, carrier);
  
  // Merge the carrier into the trace context
  Object.entries(carrier).forEach(([key, value]) => {
    traceContext[key] = value;
  });
  
  // Set the trace context in the event metadata
  event.metadata.traceContext = traceContext;
  
  // Ensure correlation ID is set
  if (!event.metadata.correlationId) {
    event.metadata.correlationId = traceContext.correlationId;
  }
  
  return event;
}

/**
 * Extracts trace context from an event and creates a new context
 * 
 * @param event - The event to extract trace context from
 * @returns A new context with the extracted trace information
 */
export function extractTraceContext(event: IBaseEvent): Context {
  if (!event.metadata?.traceContext) {
    return ROOT_CONTEXT;
  }
  
  const traceContext = event.metadata.traceContext;
  
  // Create a carrier object from the trace context
  const carrier: Record<string, string> = {};
  
  // Convert trace context to carrier format
  Object.entries(traceContext).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      carrier[key] = String(value);
    }
  });
  
  // Use OpenTelemetry propagation API to extract context
  return propagation.extract(ROOT_CONTEXT, carrier);
}

/**
 * Creates event span options from an event
 * 
 * @param event - The event to create span options from
 * @param spanKind - The kind of span to create
 * @param additionalAttributes - Additional attributes to add to the span
 * @returns Options for creating a span for the event
 */
export function createEventSpanOptionsFromEvent(
  event: IBaseEvent,
  additionalAttributes: Record<string, unknown> = {},
): EventSpanOptions {
  // Extract trace context from the event
  const ctx = extractTraceContext(event);
  
  // Create span options from the event
  const options: EventSpanOptions = {
    eventType: event.type,
    eventId: event.eventId,
    userId: event.metadata?.userId,
    journeyType: event.metadata?.journey as JourneyType,
    correlationId: event.metadata?.correlationId,
    source: event.source,
    version: event.version,
    attributes: {
      ...additionalAttributes,
    },
    parentContext: ctx,
  };
  
  return options;
}

/**
 * Creates a span for an event
 * 
 * @param event - The event to create a span for
 * @param operation - The operation being performed (publish, consume, process)
 * @param additionalAttributes - Additional attributes to add to the span
 * @returns A new span for the event
 */
export function createSpanForEvent(
  event: IBaseEvent,
  operation: 'publish' | 'consume' | 'process',
  additionalAttributes: Record<string, unknown> = {},
): Span {
  const options = createEventSpanOptionsFromEvent(event, additionalAttributes);
  
  switch (operation) {
    case 'publish':
      return createEventPublishSpan(options);
    case 'consume':
      return createEventConsumeSpan(options);
    case 'process':
      return createEventProcessSpan(options);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Creates a span for a Kafka event
 * 
 * @param topic - The Kafka topic
 * @param eventType - The type of event
 * @param spanKind - The kind of span (PRODUCER or CONSUMER)
 * @param attributes - Additional attributes for the span
 * @param parentContext - Optional parent context
 * @returns A new span for the Kafka event
 */
export function createKafkaEventSpan(
  topic: string,
  eventType: string,
  spanKind: SpanKind.PRODUCER | SpanKind.CONSUMER,
  attributes: Record<string, unknown> = {},
  parentContext: Context = context.active(),
): Span {
  const operation = spanKind === SpanKind.PRODUCER ? 'publish' : 'consume';
  const spanName = `kafka.${operation}.${topic}.${eventType}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: spanKind,
      attributes: {
        [TRACE_ATTRIBUTES.KAFKA_TOPIC]: topic,
        [TRACE_ATTRIBUTES.EVENT_TYPE]: eventType,
        ...attributes,
      },
    },
    parentContext,
  );
  
  return span;
}

/**
 * Injects trace context into Kafka message headers
 * 
 * @param headers - The Kafka message headers to inject trace context into
 * @param ctx - Optional context to use (defaults to active context)
 * @returns The headers with trace context injected
 */
export function injectTraceContextIntoKafkaHeaders(
  headers: Record<string, string> = {},
  ctx: Context = context.active(),
): Record<string, string> {
  // Use OpenTelemetry propagation API to inject context
  propagation.inject(ctx, headers);
  
  // Add correlation ID if not present
  if (!headers['correlation-id']) {
    const currentSpan = trace.getSpan(ctx);
    if (currentSpan) {
      const correlationId = currentSpan.getAttribute(TRACE_ATTRIBUTES.CORRELATION_ID) as string;
      if (correlationId) {
        headers['correlation-id'] = correlationId;
      } else {
        headers['correlation-id'] = uuidv4();
      }
    } else {
      headers['correlation-id'] = uuidv4();
    }
  }
  
  return headers;
}

/**
 * Extracts trace context from Kafka message headers
 * 
 * @param headers - The Kafka message headers to extract trace context from
 * @returns A new context with the extracted trace information
 */
export function extractTraceContextFromKafkaHeaders(
  headers: Record<string, string | Buffer> = {},
): Context {
  // Convert Buffer values to strings
  const stringHeaders: Record<string, string> = {};
  
  Object.entries(headers).forEach(([key, value]) => {
    if (Buffer.isBuffer(value)) {
      stringHeaders[key] = value.toString('utf8');
    } else if (typeof value === 'string') {
      stringHeaders[key] = value;
    }
  });
  
  // Use OpenTelemetry propagation API to extract context
  return propagation.extract(ROOT_CONTEXT, stringHeaders);
}

/**
 * Sets the result of event processing on a span
 * 
 * @param span - The span to set the result on
 * @param success - Whether the processing was successful
 * @param errorMessage - Optional error message if processing failed
 * @param additionalAttributes - Additional attributes to set on the span
 */
export function setEventProcessingResult(
  span: Span,
  success: boolean,
  errorMessage?: string,
  additionalAttributes: Record<string, unknown> = {},
): void {
  if (!span.isRecording()) {
    return;
  }
  
  span.setAttributes({
    [TRACE_ATTRIBUTES.PROCESSING_RESULT]: success ? 'success' : 'failure',
    ...additionalAttributes,
  });
  
  if (success) {
    span.setStatus({ code: SpanStatusCode.OK });
  } else {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: errorMessage || 'Event processing failed',
    });
    
    if (errorMessage) {
      span.setAttribute(TRACE_ATTRIBUTES.PROCESSING_ERROR, errorMessage);
    }
  }
}

/**
 * Sets retry information on a span
 * 
 * @param span - The span to set retry information on
 * @param retryCount - The current retry count
 * @param maxRetries - The maximum number of retries
 * @param nextRetryDelay - The delay until the next retry in milliseconds
 */
export function setRetryInformation(
  span: Span,
  retryCount: number,
  maxRetries: number,
  nextRetryDelay?: number,
): void {
  if (!span.isRecording()) {
    return;
  }
  
  span.setAttributes({
    [TRACE_ATTRIBUTES.RETRY_COUNT]: retryCount,
    'processing.max_retries': maxRetries,
  });
  
  if (nextRetryDelay !== undefined) {
    span.setAttribute('processing.next_retry_delay_ms', nextRetryDelay);
  }
}

/**
 * Creates an error tracking span for event processing errors
 * 
 * @param error - The error that occurred
 * @param eventType - The type of event being processed
 * @param eventId - The ID of the event being processed
 * @param userId - Optional user ID associated with the event
 * @param journeyType - Optional journey type for context
 * @param correlationId - Optional correlation ID for tracing
 * @param logger - Optional logger for additional logging
 * @returns A new span for the error
 */
export function trackEventError(
  error: Error,
  eventType: string,
  eventId: string,
  userId?: string,
  journeyType?: JourneyType,
  correlationId?: string,
  logger?: LoggerService,
): Span {
  const spanName = `error.event.${eventType}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        [TRACE_ATTRIBUTES.EVENT_TYPE]: eventType,
        [TRACE_ATTRIBUTES.EVENT_ID]: eventId,
        [TRACE_ATTRIBUTES.CORRELATION_ID]: correlationId || uuidv4(),
        'error.type': error.name,
        'error.message': error.message,
        'error.stack': error.stack,
        ...buildCommonAttributes(userId, journeyType, undefined, undefined, undefined),
      },
    },
  );
  
  // Record the exception
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  
  // Log the error if logger is provided
  if (logger) {
    logger.error(
      `Error processing event: ${eventType} (${eventId})`,
      error.stack,
      'EventTracing',
    );
  }
  
  // End the span
  span.end();
  
  return span;
}

/**
 * Creates a span for tracking event processing metrics
 * 
 * @param eventType - The type of event being processed
 * @param processingTimeMs - The time taken to process the event in milliseconds
 * @param success - Whether the processing was successful
 * @param journeyType - Optional journey type for context
 * @param attributes - Additional attributes for the span
 * @returns A new span for the metrics
 */
export function trackEventProcessingMetrics(
  eventType: string,
  processingTimeMs: number,
  success: boolean,
  journeyType?: JourneyType,
  attributes: Record<string, unknown> = {},
): Span {
  const spanName = `metrics.event.${eventType}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        [TRACE_ATTRIBUTES.EVENT_TYPE]: eventType,
        'processing.duration_ms': processingTimeMs,
        [TRACE_ATTRIBUTES.PROCESSING_RESULT]: success ? 'success' : 'failure',
        ...(journeyType ? { [TRACE_ATTRIBUTES.JOURNEY_TYPE]: journeyType } : {}),
        ...attributes,
      },
    },
  );
  
  // Set the span status
  if (success) {
    span.setStatus({ code: SpanStatusCode.OK });
  } else {
    span.setStatus({ code: SpanStatusCode.ERROR });
  }
  
  // End the span
  span.end();
  
  return span;
}

/**
 * Builds common attributes for spans based on event information
 * 
 * @param userId - The user ID associated with the event
 * @param journeyType - The type of journey
 * @param journeyId - The ID of the journey
 * @param source - The source of the event
 * @param version - The version of the event
 * @returns Common attributes for spans
 */
/**
 * Creates a span for audit logging
 * 
 * @param auditInfo - The audit information to log
 * @param journeyType - Optional journey type for context
 * @param attributes - Additional attributes for the span
 * @param parentContext - Optional parent context
 * @returns A new span for the audit log
 */
export function createAuditSpan(
  auditInfo: AuditInfo,
  journeyType?: JourneyType,
  attributes: Record<string, unknown> = {},
  parentContext: Context = context.active(),
): Span {
  const spanName = `audit.${auditInfo.action}.${auditInfo.resource}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(
    spanName,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        [TRACE_ATTRIBUTES.AUDIT_ACTION]: auditInfo.action,
        [TRACE_ATTRIBUTES.AUDIT_RESOURCE]: auditInfo.resource,
        [TRACE_ATTRIBUTES.AUDIT_OUTCOME]: auditInfo.outcome,
        [TRACE_ATTRIBUTES.AUDIT_TIMESTAMP]: auditInfo.timestamp || new Date().toISOString(),
        ...buildAuditAttributes(auditInfo),
        ...(journeyType ? { [TRACE_ATTRIBUTES.JOURNEY_TYPE]: journeyType } : {}),
        ...attributes,
      },
    },
    parentContext,
  );
  
  return span;
}

/**
 * Logs an audit event with OpenTelemetry and optional logger
 * 
 * @param auditInfo - The audit information to log
 * @param logger - Optional logger service for additional logging
 * @param journeyType - Optional journey type for context
 * @param attributes - Additional attributes for the span
 */
export function logAuditEvent(
  auditInfo: AuditInfo,
  logger?: LoggerService,
  journeyType?: JourneyType,
  attributes: Record<string, unknown> = {},
): void {
  const span = createAuditSpan(auditInfo, journeyType, attributes);
  
  try {
    // Set span status based on audit outcome
    if (auditInfo.outcome === 'success') {
      span.setStatus({ code: SpanStatusCode.OK });
    } else {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `Audit failure: ${auditInfo.action} on ${auditInfo.resource}`,
      });
    }
    
    // Log the audit event if logger is provided
    if (logger) {
      const logMethod = auditInfo.outcome === 'success' ? logger.log : logger.warn;
      logMethod.call(
        logger,
        `AUDIT: ${auditInfo.action} on ${auditInfo.resource} by ${auditInfo.actor || 'system'} - ${auditInfo.outcome}`,
        'AuditLog',
      );
    }
  } finally {
    span.end();
  }
}

/**
 * Adds compliance information to a span
 * 
 * @param span - The span to add compliance information to
 * @param complianceInfo - The compliance information to add
 */
export function addComplianceInfo(span: Span, complianceInfo: ComplianceInfo): void {
  if (!span.isRecording()) {
    return;
  }
  
  span.setAttributes({
    [TRACE_ATTRIBUTES.COMPLIANCE_CATEGORY]: complianceInfo.category,
    [TRACE_ATTRIBUTES.COMPLIANCE_SENSITIVITY]: complianceInfo.dataSensitivity,
    ...(complianceInfo.requirement ? { [TRACE_ATTRIBUTES.COMPLIANCE_REQUIREMENT]: complianceInfo.requirement } : {}),
  });
}

/**
 * Builds audit attributes from audit information
 * 
 * @param auditInfo - The audit information
 * @returns Audit attributes for spans
 */
function buildAuditAttributes(auditInfo: AuditInfo): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  
  if (auditInfo.actor) {
    attributes[TRACE_ATTRIBUTES.AUDIT_ACTOR] = auditInfo.actor;
  }
  
  if (auditInfo.target) {
    attributes[TRACE_ATTRIBUTES.AUDIT_TARGET] = auditInfo.target;
  }
  
  if (auditInfo.details) {
    Object.entries(auditInfo.details).forEach(([key, value]) => {
      attributes[`audit.details.${key}`] = value;
    });
  }
  
  return attributes;
}

/**
 * Builds common attributes for spans based on event information
 * 
 * @param userId - The user ID associated with the event
 * @param journeyType - The type of journey
 * @param journeyId - The ID of the journey
 * @param source - The source of the event
 * @param version - The version of the event
 * @returns Common attributes for spans
 */
function buildCommonAttributes(
  userId?: string,
  journeyType?: JourneyType,
  journeyId?: string,
  source?: string,
  version?: string,
): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  
  if (userId) {
    attributes[TRACE_ATTRIBUTES.USER_ID] = userId;
  }
  
  if (journeyType) {
    attributes[TRACE_ATTRIBUTES.JOURNEY_TYPE] = journeyType;
  }
  
  if (journeyId) {
    attributes[TRACE_ATTRIBUTES.JOURNEY_ID] = journeyId;
  }
  
  if (source) {
    attributes[TRACE_ATTRIBUTES.EVENT_SOURCE] = source;
  }
  
  if (version) {
    attributes[TRACE_ATTRIBUTES.EVENT_VERSION] = version;
  }
  
  return attributes;
}