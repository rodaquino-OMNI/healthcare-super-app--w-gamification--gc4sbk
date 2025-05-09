/**
 * @file correlation-id.ts
 * @description Manages correlation IDs across distributed systems to enable end-to-end tracing of event flows.
 * This utility provides functions to generate, extract, and propagate correlation IDs through event processing
 * pipelines, allowing related events to be linked across multiple services, topics, and processing stages.
 * Essential for debugging, monitoring, and analyzing the event flow across the SuperApp architecture.
 *
 * Key features:
 * - UUID v4 based correlation ID generation
 * - Extraction helpers for various event formats
 * - Context propagation utilities for cross-service tracing
 * - Integration with OpenTelemetry for distributed tracing
 * - Header constants for standardized correlation ID transmission
 * - Retry tracking with exponential backoff support
 * - Audit logging capabilities for compliance requirements
 */

import { v4 as uuidv4 } from 'uuid';
import { context, propagation, ROOT_CONTEXT, Context, SpanContext, trace, Span, SpanStatusCode } from '@opentelemetry/api';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { LoggerService } from '@nestjs/common';

/**
 * Constants for correlation ID header names in different protocols
 */
export const CORRELATION_HEADERS = {
  HTTP: 'x-correlation-id',
  KAFKA: 'correlation-id',
  INTERNAL: 'correlationId',
  TRACE_PARENT: 'traceparent',
  TRACE_STATE: 'tracestate',
  BAGGAGE: 'baggage',
};

/**
 * Interface for correlation context that can be attached to events, requests, and logs
 */
export interface CorrelationContext {
  correlationId: string;
  traceId?: string;
  spanId?: string;
  parentId?: string;
  journeyType?: string;
  userId?: string;
  requestId?: string;
  timestamp?: string;
  source?: string;
  retryCount?: number;
  retryAttempt?: number;
  maxRetries?: number;
  nextRetryTime?: string;
  retryBackoffMs?: number;
  [key: string]: unknown;
}

/**
 * Interface for retry context that can be attached to events and used for retry mechanisms
 */
export interface RetryContext {
  retryCount: number;
  maxRetries: number;
  initialBackoffMs: number;
  currentBackoffMs: number;
  nextRetryTime: Date;
  correlationId: string;
  firstAttemptTime: Date;
  lastAttemptTime: Date;
  errorMessages: string[];
  errorTypes: string[];
  journeyType?: string;
  eventType?: string;
  eventId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Generates a new correlation ID using UUID v4
 * 
 * @returns A new correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Gets the current correlation ID from the active context or generates a new one
 * 
 * @param generateIfMissing - Whether to generate a new correlation ID if none exists
 * @returns The current correlation ID or undefined if none exists and generateIfMissing is false
 */
export function getCurrentCorrelationId(generateIfMissing = true): string | undefined {
  const ctx = context.active();
  const baggage = propagation.getBaggage(ctx);
  
  if (baggage) {
    const entry = baggage.getEntry('correlation-id');
    if (entry?.value) {
      return entry.value;
    }
  }
  
  return generateIfMissing ? generateCorrelationId() : undefined;
}

/**
 * Creates a correlation context with the current trace information
 * 
 * @param correlationId - Optional correlation ID (generates a new one if not provided)
 * @param additionalContext - Additional context properties to include
 * @returns A correlation context object
 */
export function createCorrelationContext(
  correlationId?: string,
  additionalContext: Record<string, unknown> = {},
): CorrelationContext {
  const currentCorrelationId = correlationId || getCurrentCorrelationId();
  const ctx = context.active();
  const spanContext = getActiveSpanContext();
  
  const correlationContext: CorrelationContext = {
    correlationId: currentCorrelationId,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
  
  if (spanContext) {
    correlationContext.traceId = spanContext.traceId;
    correlationContext.spanId = spanContext.spanId;
  }
  
  return correlationContext;
}

/**
 * Gets the active span context from the current context
 * 
 * @returns The active span context or undefined if none exists
 */
export function getActiveSpanContext(): SpanContext | undefined {
  const ctx = context.active();
  const span = ctx.getValue('current-span');
  
  if (span) {
    return span.spanContext();
  }
  
  return undefined;
}

/**
 * Extracts correlation ID from HTTP headers
 * 
 * @param headers - HTTP headers object
 * @param generateIfMissing - Whether to generate a new correlation ID if none exists
 * @returns The extracted correlation ID or a new one if generateIfMissing is true
 */
export function extractCorrelationIdFromHttpHeaders(
  headers: Record<string, string | string[] | undefined>,
  generateIfMissing = true,
): string | undefined {
  // Try standard header
  const correlationId = headers[CORRELATION_HEADERS.HTTP] as string;
  if (correlationId) {
    return correlationId;
  }
  
  // Try lowercase header
  const lowerCaseCorrelationId = headers[CORRELATION_HEADERS.HTTP.toLowerCase()] as string;
  if (lowerCaseCorrelationId) {
    return lowerCaseCorrelationId;
  }
  
  // Try internal format
  const internalCorrelationId = headers[CORRELATION_HEADERS.INTERNAL] as string;
  if (internalCorrelationId) {
    return internalCorrelationId;
  }
  
  return generateIfMissing ? generateCorrelationId() : undefined;
}

/**
 * Extracts correlation ID from Kafka message headers
 * 
 * @param headers - Kafka message headers
 * @param generateIfMissing - Whether to generate a new correlation ID if none exists
 * @returns The extracted correlation ID or a new one if generateIfMissing is true
 */
export function extractCorrelationIdFromKafkaHeaders(
  headers: Record<string, Buffer | string | undefined>,
  generateIfMissing = true,
): string | undefined {
  const correlationIdHeader = headers[CORRELATION_HEADERS.KAFKA];
  
  if (correlationIdHeader) {
    if (Buffer.isBuffer(correlationIdHeader)) {
      return correlationIdHeader.toString('utf8');
    }
    return correlationIdHeader as string;
  }
  
  return generateIfMissing ? generateCorrelationId() : undefined;
}

/**
 * Extracts correlation ID from an event object
 * 
 * @param event - The event object
 * @param generateIfMissing - Whether to generate a new correlation ID if none exists
 * @returns The extracted correlation ID or a new one if generateIfMissing is true
 */
export function extractCorrelationIdFromEvent(
  event: IBaseEvent,
  generateIfMissing = true,
): string | undefined {
  if (event.metadata?.correlationId) {
    return event.metadata.correlationId as string;
  }
  
  if (event.metadata?.traceContext?.correlationId) {
    return event.metadata.traceContext.correlationId as string;
  }
  
  return generateIfMissing ? generateCorrelationId() : undefined;
}

/**
 * Injects correlation ID into HTTP headers
 * 
 * @param headers - HTTP headers object to inject into
 * @param correlationId - Correlation ID to inject (uses current or generates new if not provided)
 * @returns The headers object with correlation ID injected
 */
export function injectCorrelationIdIntoHttpHeaders(
  headers: Record<string, string | string[]>,
  correlationId?: string,
): Record<string, string | string[]> {
  const currentCorrelationId = correlationId || getCurrentCorrelationId();
  
  headers[CORRELATION_HEADERS.HTTP] = currentCorrelationId;
  
  return headers;
}

/**
 * Injects correlation ID into Kafka message headers
 * 
 * @param headers - Kafka message headers to inject into
 * @param correlationId - Correlation ID to inject (uses current or generates new if not provided)
 * @returns The headers object with correlation ID injected
 */
export function injectCorrelationIdIntoKafkaHeaders(
  headers: Record<string, Buffer | string> = {},
  correlationId?: string,
): Record<string, Buffer | string> {
  const currentCorrelationId = correlationId || getCurrentCorrelationId();
  
  headers[CORRELATION_HEADERS.KAFKA] = currentCorrelationId;
  
  return headers;
}

/**
 * Injects correlation ID into an event object
 * 
 * @param event - The event object to inject into
 * @param correlationId - Correlation ID to inject (uses current or generates new if not provided)
 * @returns The event object with correlation ID injected
 */
export function injectCorrelationIdIntoEvent<T extends IBaseEvent>(
  event: T,
  correlationId?: string,
): T {
  const currentCorrelationId = correlationId || getCurrentCorrelationId();
  
  if (!event.metadata) {
    event.metadata = {};
  }
  
  event.metadata.correlationId = currentCorrelationId;
  
  return event;
}

/**
 * Creates a context with correlation ID for OpenTelemetry
 * 
 * @param correlationId - Correlation ID to use (uses current or generates new if not provided)
 * @returns A new context with the correlation ID
 */
export function createContextWithCorrelationId(correlationId?: string): Context {
  const currentCorrelationId = correlationId || getCurrentCorrelationId();
  const baggage = propagation.getBaggage(context.active()) || propagation.createBaggage();
  
  const updatedBaggage = baggage.setEntry('correlation-id', { value: currentCorrelationId });
  
  return propagation.setBaggage(context.active(), updatedBaggage);
}

/**
 * Extracts correlation context from OpenTelemetry context
 * 
 * @param ctx - The OpenTelemetry context (defaults to active context)
 * @returns A correlation context object
 */
export function extractCorrelationContextFromOtelContext(ctx: Context = context.active()): CorrelationContext {
  const baggage = propagation.getBaggage(ctx);
  let correlationId = generateCorrelationId();
  
  if (baggage) {
    const entry = baggage.getEntry('correlation-id');
    if (entry?.value) {
      correlationId = entry.value;
    }
  }
  
  const spanContext = getActiveSpanContext();
  
  const correlationContext: CorrelationContext = {
    correlationId,
    timestamp: new Date().toISOString(),
  };
  
  if (spanContext) {
    correlationContext.traceId = spanContext.traceId;
    correlationContext.spanId = spanContext.spanId;
  }
  
  return correlationContext;
}

/**
 * Extracts correlation context from HTTP headers and creates an OpenTelemetry context
 * 
 * @param headers - HTTP headers object
 * @returns A new context with the extracted correlation information
 */
export function extractContextFromHttpHeaders(
  headers: Record<string, string | string[] | undefined>,
): Context {
  // Extract correlation ID
  const correlationId = extractCorrelationIdFromHttpHeaders(headers, true);
  
  // Use OpenTelemetry propagation API to extract context
  const carrier: Record<string, string> = {};
  
  // Convert headers to carrier format
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      carrier[key.toLowerCase()] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      carrier[key.toLowerCase()] = value[0];
    }
  });
  
  // Extract context using OpenTelemetry propagation
  let ctx = propagation.extract(ROOT_CONTEXT, carrier);
  
  // Add correlation ID to baggage
  const baggage = propagation.getBaggage(ctx) || propagation.createBaggage();
  const updatedBaggage = baggage.setEntry('correlation-id', { value: correlationId });
  ctx = propagation.setBaggage(ctx, updatedBaggage);
  
  return ctx;
}

/**
 * Extracts correlation context from Kafka headers and creates an OpenTelemetry context
 * 
 * @param headers - Kafka message headers
 * @returns A new context with the extracted correlation information
 */
export function extractContextFromKafkaHeaders(
  headers: Record<string, Buffer | string | undefined>,
): Context {
  // Extract correlation ID
  const correlationId = extractCorrelationIdFromKafkaHeaders(headers, true);
  
  // Use OpenTelemetry propagation API to extract context
  const carrier: Record<string, string> = {};
  
  // Convert headers to carrier format
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      carrier[key.toLowerCase()] = value;
    } else if (Buffer.isBuffer(value)) {
      carrier[key.toLowerCase()] = value.toString('utf8');
    }
  });
  
  // Extract context using OpenTelemetry propagation
  let ctx = propagation.extract(ROOT_CONTEXT, carrier);
  
  // Add correlation ID to baggage
  const baggage = propagation.getBaggage(ctx) || propagation.createBaggage();
  const updatedBaggage = baggage.setEntry('correlation-id', { value: correlationId });
  ctx = propagation.setBaggage(ctx, updatedBaggage);
  
  return ctx;
}

/**
 * Injects correlation context into HTTP headers for propagation
 * 
 * @param headers - HTTP headers object to inject into
 * @param ctx - The OpenTelemetry context to inject (defaults to active context)
 * @returns The headers object with correlation context injected
 */
export function injectContextIntoHttpHeaders(
  headers: Record<string, string | string[]>,
  ctx: Context = context.active(),
): Record<string, string | string[]> {
  // Get correlation ID from context or generate a new one
  const baggage = propagation.getBaggage(ctx);
  let correlationId: string;
  
  if (baggage) {
    const entry = baggage.getEntry('correlation-id');
    correlationId = entry?.value || generateCorrelationId();
  } else {
    correlationId = generateCorrelationId();
  }
  
  // Inject correlation ID into headers
  headers[CORRELATION_HEADERS.HTTP] = correlationId;
  
  // Use OpenTelemetry propagation API to inject context
  propagation.inject(ctx, headers);
  
  return headers;
}

/**
 * Injects correlation context into Kafka headers for propagation
 * 
 * @param headers - Kafka message headers to inject into
 * @param ctx - The OpenTelemetry context to inject (defaults to active context)
 * @returns The headers object with correlation context injected
 */
export function injectContextIntoKafkaHeaders(
  headers: Record<string, Buffer | string> = {},
  ctx: Context = context.active(),
): Record<string, Buffer | string> {
  // Get correlation ID from context or generate a new one
  const baggage = propagation.getBaggage(ctx);
  let correlationId: string;
  
  if (baggage) {
    const entry = baggage.getEntry('correlation-id');
    correlationId = entry?.value || generateCorrelationId();
  } else {
    correlationId = generateCorrelationId();
  }
  
  // Inject correlation ID into headers
  headers[CORRELATION_HEADERS.KAFKA] = correlationId;
  
  // Use OpenTelemetry propagation API to inject context
  const carrier: Record<string, string> = {};
  propagation.inject(ctx, carrier);
  
  // Convert carrier to Kafka headers format
  Object.entries(carrier).forEach(([key, value]) => {
    headers[key] = value;
  });
  
  return headers;
}

/**
 * Creates a correlation context for logging
 * 
 * @param additionalContext - Additional context properties to include
 * @returns A correlation context object suitable for logging
 */
export function createLoggingCorrelationContext(
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const correlationContext = createCorrelationContext(undefined, additionalContext);
  
  return {
    correlationId: correlationContext.correlationId,
    traceId: correlationContext.traceId,
    spanId: correlationContext.spanId,
    ...additionalContext,
  };
}

/**
 * Creates a correlation context for audit logging
 * 
 * @param action - The action being performed
 * @param resource - The resource being acted upon
 * @param outcome - The outcome of the action
 * @param additionalContext - Additional context properties to include
 * @returns A correlation context object suitable for audit logging
 */
export function createAuditCorrelationContext(
  action: string,
  resource: string,
  outcome: 'success' | 'failure',
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const correlationContext = createCorrelationContext(undefined, additionalContext);
  
  return {
    correlationId: correlationContext.correlationId,
    traceId: correlationContext.traceId,
    spanId: correlationContext.spanId,
    action,
    resource,
    outcome,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Creates a correlation context for monitoring
 * 
 * @param metricName - The name of the metric
 * @param value - The value of the metric
 * @param additionalContext - Additional context properties to include
 * @returns A correlation context object suitable for monitoring
 */
export function createMonitoringCorrelationContext(
  metricName: string,
  value: number,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const correlationContext = createCorrelationContext(undefined, additionalContext);
  
  return {
    correlationId: correlationContext.correlationId,
    traceId: correlationContext.traceId,
    spanId: correlationContext.spanId,
    metricName,
    value,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Attaches correlation context to an error object for better error tracking
 * 
 * @param error - The error object to enhance
 * @param correlationContext - Optional correlation context (uses current context if not provided)
 * @returns The error with correlation context attached
 */
export function attachCorrelationContextToError(
  error: Error,
  correlationContext?: CorrelationContext,
): Error {
  const context = correlationContext || createCorrelationContext();
  
  const enhancedError = error as Error & { correlationContext?: CorrelationContext };
  enhancedError.correlationContext = context;
  
  return enhancedError;
}

/**
 * Creates a correlation ID chain for tracking related events
 * 
 * @param parentCorrelationId - The parent correlation ID
 * @param childCorrelationIds - Child correlation IDs to link
 * @returns A correlation chain object
 */
export function createCorrelationChain(
  parentCorrelationId: string,
  ...childCorrelationIds: string[]
): Record<string, unknown> {
  return {
    parentCorrelationId: ensureValidCorrelationId(parentCorrelationId),
    childCorrelationIds: childCorrelationIds.map(ensureValidCorrelationId),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Adds a child correlation ID to a parent correlation ID chain
 * 
 * @param parentCorrelationId - The parent correlation ID
 * @param childCorrelationId - The child correlation ID to add
 * @param metadata - Optional metadata to store with the correlation
 * @returns A correlation chain object
 */
export function addChildCorrelationId(
  parentCorrelationId: string,
  childCorrelationId: string,
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    parentCorrelationId: ensureValidCorrelationId(parentCorrelationId),
    childCorrelationId: ensureValidCorrelationId(childCorrelationId),
    timestamp: new Date().toISOString(),
    ...metadata,
  };
}

/**
 * Creates a correlation context for dead letter queue (DLQ) events
 * 
 * @param originalEvent - The original event that failed
 * @param error - The error that caused the failure
 * @param retryContext - Optional retry context if available
 * @returns A correlation context for DLQ
 */
export function createDlqCorrelationContext(
  originalEvent: IBaseEvent,
  error: Error,
  retryContext?: RetryContext,
): Record<string, unknown> {
  const correlationId = extractCorrelationIdFromEvent(originalEvent, true);
  const context = createCorrelationContext(correlationId, {
    eventType: originalEvent.type,
    eventId: originalEvent.eventId,
    source: originalEvent.source,
    version: originalEvent.version,
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
    originalEventTimestamp: originalEvent.timestamp,
  });
  
  if (retryContext) {
    return {
      ...context,
      retryCount: retryContext.retryCount,
      maxRetries: retryContext.maxRetries,
      firstAttemptTime: retryContext.firstAttemptTime.toISOString(),
      lastAttemptTime: retryContext.lastAttemptTime.toISOString(),
      errorMessages: retryContext.errorMessages,
      errorTypes: retryContext.errorTypes,
    };
  }
  
  return context;
}

/**
 * Executes a function within a correlation context
 * 
 * @param fn - The function to execute
 * @param correlationId - Optional correlation ID (uses current or generates new if not provided)
 * @returns The result of the function execution
 */
export async function withCorrelationId<T>(
  fn: () => Promise<T>,
  correlationId?: string,
): Promise<T> {
  const currentCorrelationId = correlationId || getCurrentCorrelationId();
  const ctx = createContextWithCorrelationId(currentCorrelationId);
  
  return context.with(ctx, fn);
}

/**
 * Checks if a correlation ID is valid (UUID v4 format)
 * 
 * @param correlationId - The correlation ID to validate
 * @returns Whether the correlation ID is valid
 */
export function isValidCorrelationId(correlationId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(correlationId);
}

/**
 * Ensures a valid correlation ID, either validating the provided one or generating a new one
 * 
 * @param correlationId - The correlation ID to validate
 * @returns A valid correlation ID (either the provided one if valid, or a new one)
 */
export function ensureValidCorrelationId(correlationId?: string): string {
  if (correlationId && isValidCorrelationId(correlationId)) {
    return correlationId;
  }
  
  return generateCorrelationId();
}

/**
 * Creates a new retry context for an event that needs to be retried
 * 
 * @param correlationId - The correlation ID for the event
 * @param maxRetries - The maximum number of retries allowed
 * @param initialBackoffMs - The initial backoff time in milliseconds
 * @param additionalContext - Additional context properties to include
 * @returns A new retry context
 */
export function createRetryContext(
  correlationId: string,
  maxRetries = 3,
  initialBackoffMs = 1000,
  additionalContext: Record<string, unknown> = {},
): RetryContext {
  const now = new Date();
  
  return {
    retryCount: 0,
    maxRetries,
    initialBackoffMs,
    currentBackoffMs: initialBackoffMs,
    nextRetryTime: new Date(now.getTime() + initialBackoffMs),
    correlationId: ensureValidCorrelationId(correlationId),
    firstAttemptTime: now,
    lastAttemptTime: now,
    errorMessages: [],
    errorTypes: [],
    ...additionalContext,
  };
}

/**
 * Updates a retry context for the next retry attempt with exponential backoff
 * 
 * @param retryContext - The current retry context
 * @param error - The error that caused the retry
 * @param backoffFactor - The factor to multiply the backoff time by (default: 2)
 * @param maxBackoffMs - The maximum backoff time in milliseconds (default: 60000 - 1 minute)
 * @param jitter - Whether to add jitter to the backoff time (default: true)
 * @returns The updated retry context
 */
export function updateRetryContext(
  retryContext: RetryContext,
  error: Error,
  backoffFactor = 2,
  maxBackoffMs = 60000,
  jitter = true,
): RetryContext {
  // Increment retry count
  retryContext.retryCount += 1;
  
  // Update last attempt time
  retryContext.lastAttemptTime = new Date();
  
  // Add error information
  retryContext.errorMessages.push(error.message);
  retryContext.errorTypes.push(error.name);
  
  // Calculate next backoff time with exponential backoff
  let nextBackoffMs = retryContext.currentBackoffMs * backoffFactor;
  
  // Apply jitter if enabled (adds randomness to prevent thundering herd)
  if (jitter) {
    // Add random jitter between -25% and +25% of the backoff time
    const jitterFactor = 0.25;
    const jitterAmount = nextBackoffMs * jitterFactor;
    nextBackoffMs += Math.random() * jitterAmount * 2 - jitterAmount;
  }
  
  // Cap at maximum backoff
  nextBackoffMs = Math.min(nextBackoffMs, maxBackoffMs);
  
  // Update context
  retryContext.currentBackoffMs = nextBackoffMs;
  retryContext.nextRetryTime = new Date(retryContext.lastAttemptTime.getTime() + nextBackoffMs);
  
  return retryContext;
}

/**
 * Checks if a retry should be attempted based on the retry context
 * 
 * @param retryContext - The retry context to check
 * @returns Whether a retry should be attempted
 */
export function shouldRetry(retryContext: RetryContext): boolean {
  return retryContext.retryCount < retryContext.maxRetries;
}

/**
 * Attaches retry context to an event for retry tracking
 * 
 * @param event - The event to attach retry context to
 * @param retryContext - The retry context to attach
 * @returns The event with retry context attached
 */
export function attachRetryContextToEvent<T extends IBaseEvent>(
  event: T,
  retryContext: RetryContext,
): T {
  if (!event.metadata) {
    event.metadata = {};
  }
  
  event.metadata.retryContext = retryContext;
  event.metadata.correlationId = retryContext.correlationId;
  event.metadata.retryCount = retryContext.retryCount;
  event.metadata.maxRetries = retryContext.maxRetries;
  event.metadata.nextRetryTime = retryContext.nextRetryTime.toISOString();
  
  return event;
}

/**
 * Extracts retry context from an event
 * 
 * @param event - The event to extract retry context from
 * @param createIfMissing - Whether to create a new retry context if none exists
 * @returns The extracted retry context or undefined if none exists and createIfMissing is false
 */
export function extractRetryContextFromEvent(
  event: IBaseEvent,
  createIfMissing = false,
): RetryContext | undefined {
  if (event.metadata?.retryContext) {
    return event.metadata.retryContext as RetryContext;
  }
  
  if (createIfMissing) {
    const correlationId = extractCorrelationIdFromEvent(event, true);
    return createRetryContext(correlationId, 3, 1000, {
      eventType: event.type,
      eventId: event.eventId,
      userId: event.metadata?.userId,
      journeyType: event.metadata?.journey,
    });
  }
  
  return undefined;
}

/**
 * Creates a span for retry tracking
 * 
 * @param retryContext - The retry context to track
 * @param operation - The operation being retried
 * @returns A new span for retry tracking
 */
export function createRetrySpan(retryContext: RetryContext, operation: string): Span {
  const spanName = `retry.${operation}`;
  const tracer = trace.getTracer('austa-events');
  
  const span = tracer.startSpan(spanName, {
    attributes: {
      'retry.count': retryContext.retryCount,
      'retry.max_retries': retryContext.maxRetries,
      'retry.initial_backoff_ms': retryContext.initialBackoffMs,
      'retry.current_backoff_ms': retryContext.currentBackoffMs,
      'retry.correlation_id': retryContext.correlationId,
      'retry.first_attempt_time': retryContext.firstAttemptTime.toISOString(),
      'retry.last_attempt_time': retryContext.lastAttemptTime.toISOString(),
      'retry.next_retry_time': retryContext.nextRetryTime.toISOString(),
      ...(retryContext.eventType ? { 'event.type': retryContext.eventType } : {}),
      ...(retryContext.eventId ? { 'event.id': retryContext.eventId } : {}),
      ...(retryContext.userId ? { 'user.id': retryContext.userId } : {}),
      ...(retryContext.journeyType ? { 'journey.type': retryContext.journeyType } : {}),
    },
  });
  
  return span;
}

/**
 * Executes a function with retry logic using exponential backoff
 * 
 * @param fn - The function to execute
 * @param options - Retry options
 * @param logger - Optional logger for logging retry attempts
 * @returns The result of the function execution
 */
export async function withRetry<T>(
  fn: (attempt: number, retryContext: RetryContext) => Promise<T>,
  options: {
    maxRetries?: number;
    initialBackoffMs?: number;
    backoffFactor?: number;
    maxBackoffMs?: number;
    jitter?: boolean;
    correlationId?: string;
    operation?: string;
    shouldRetryError?: (error: Error) => boolean;
  } = {},
  logger?: LoggerService,
): Promise<T> {
  const {
    maxRetries = 3,
    initialBackoffMs = 1000,
    backoffFactor = 2,
    maxBackoffMs = 60000,
    jitter = true,
    correlationId = generateCorrelationId(),
    operation = 'operation',
    shouldRetryError = () => true,
  } = options;
  
  // Create retry context
  const retryContext = createRetryContext(correlationId, maxRetries, initialBackoffMs);
  
  // Create retry span
  const retrySpan = createRetrySpan(retryContext, operation);
  
  try {
    // First attempt
    try {
      const result = await fn(retryContext.retryCount, retryContext);
      retrySpan.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // If we shouldn't retry this error, rethrow immediately
      if (!shouldRetryError(error)) {
        throw error;
      }
      
      // Update retry context for first failure
      updateRetryContext(retryContext, error, backoffFactor, maxBackoffMs, jitter);
      
      // Log first failure if logger provided
      if (logger) {
        logger.warn(
          `Retry 1/${maxRetries} for ${operation} failed: ${error.message}. ` +
          `Next retry in ${Math.round(retryContext.currentBackoffMs)}ms.`,
          { correlationId, retryContext },
        );
      }
      
      // If we've reached max retries, rethrow
      if (!shouldRetry(retryContext)) {
        retrySpan.setAttribute('retry.exhausted', true);
        retrySpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Max retries (${maxRetries}) reached for ${operation}`,
        });
        throw error;
      }
    }
    
    // Retry loop
    while (shouldRetry(retryContext)) {
      // Wait for backoff period
      await new Promise(resolve => setTimeout(resolve, retryContext.currentBackoffMs));
      
      try {
        // Attempt retry
        const result = await fn(retryContext.retryCount, retryContext);
        retrySpan.setStatus({ code: SpanStatusCode.OK });
        
        // Log success if logger provided
        if (logger) {
          logger.log(
            `Retry ${retryContext.retryCount}/${maxRetries} for ${operation} succeeded after ` +
            `${retryContext.retryCount} attempts.`,
            { correlationId, retryContext },
          );
        }
        
        return result;
      } catch (error) {
        // If we shouldn't retry this error, rethrow immediately
        if (!shouldRetryError(error)) {
          throw error;
        }
        
        // Update retry context
        updateRetryContext(retryContext, error, backoffFactor, maxBackoffMs, jitter);
        
        // Log failure if logger provided
        if (logger) {
          logger.warn(
            `Retry ${retryContext.retryCount}/${maxRetries} for ${operation} failed: ${error.message}. ` +
            (shouldRetry(retryContext)
              ? `Next retry in ${Math.round(retryContext.currentBackoffMs)}ms.`
              : 'No more retries.'),
            { correlationId, retryContext },
          );
        }
        
        // If we've reached max retries, rethrow
        if (!shouldRetry(retryContext)) {
          retrySpan.setAttribute('retry.exhausted', true);
          retrySpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: `Max retries (${maxRetries}) reached for ${operation}`,
          });
          throw error;
        }
      }
    }
    
    // This should never happen, but TypeScript needs a return statement
    throw new Error(`Unexpected state in retry loop for ${operation}`);
  } finally {
    // Always end the retry span
    retrySpan.end();
  }
}