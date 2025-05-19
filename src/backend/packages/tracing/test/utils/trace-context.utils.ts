import { Context, SpanContext, trace, context, ROOT_CONTEXT, SpanKind, TraceFlags } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { randomUUID } from 'crypto';

/**
 * Journey types supported in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for trace context options
 */
export interface TraceContextOptions {
  /** Optional trace ID to use (will generate random if not provided) */
  traceId?: string;
  /** Optional span ID to use (will generate random if not provided) */
  spanId?: string;
  /** Optional parent context to use */
  parentContext?: Context;
  /** Optional user ID to associate with the trace */
  userId?: string;
  /** Optional correlation ID to associate with the trace */
  correlationId?: string;
  /** Optional span name */
  spanName?: string;
  /** Optional span kind */
  spanKind?: SpanKind;
  /** Optional trace flags */
  traceFlags?: TraceFlags;
  /** Optional additional attributes */
  attributes?: Record<string, string | number | boolean | string[]>;
}

/**
 * Generates a random 16-byte trace ID as a hex string
 */
export function generateTraceId(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Generates a random 8-byte span ID as a hex string
 */
export function generateSpanId(): string {
  return randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Generates a correlation ID for connecting logs, traces, and metrics
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Creates a basic trace context with the provided options
 */
export function createTraceContext(options: TraceContextOptions = {}): Context {
  const traceId = options.traceId || generateTraceId();
  const spanId = options.spanId || generateSpanId();
  const correlationId = options.correlationId || generateCorrelationId();
  
  const spanContext: SpanContext = {
    traceId,
    spanId,
    traceFlags: options.traceFlags || TraceFlags.SAMPLED,
    isRemote: false,
    traceState: undefined,
  };

  // Start with parent context or root context
  const parentContext = options.parentContext || ROOT_CONTEXT;
  
  // Create the span context
  const ctx = trace.setSpanContext(parentContext, spanContext);
  
  // Add correlation ID to the context
  return context.with(ctx, 'correlation-id', correlationId);
}

/**
 * Creates a trace context for the Health journey
 */
export function createHealthJourneyContext(options: TraceContextOptions = {}): Context {
  const attributes = {
    'journey.type': JourneyType.HEALTH,
    [SemanticAttributes.SERVICE_NAME]: 'health-service',
    ...options.attributes,
  };
  
  if (options.userId) {
    attributes['user.id'] = options.userId;
  }
  
  return createTraceContext({
    ...options,
    spanName: options.spanName || 'health-journey-operation',
    spanKind: options.spanKind || SpanKind.SERVER,
    attributes,
  });
}

/**
 * Creates a trace context for the Care journey
 */
export function createCareJourneyContext(options: TraceContextOptions = {}): Context {
  const attributes = {
    'journey.type': JourneyType.CARE,
    [SemanticAttributes.SERVICE_NAME]: 'care-service',
    ...options.attributes,
  };
  
  if (options.userId) {
    attributes['user.id'] = options.userId;
  }
  
  return createTraceContext({
    ...options,
    spanName: options.spanName || 'care-journey-operation',
    spanKind: options.spanKind || SpanKind.SERVER,
    attributes,
  });
}

/**
 * Creates a trace context for the Plan journey
 */
export function createPlanJourneyContext(options: TraceContextOptions = {}): Context {
  const attributes = {
    'journey.type': JourneyType.PLAN,
    [SemanticAttributes.SERVICE_NAME]: 'plan-service',
    ...options.attributes,
  };
  
  if (options.userId) {
    attributes['user.id'] = options.userId;
  }
  
  return createTraceContext({
    ...options,
    spanName: options.spanName || 'plan-journey-operation',
    spanKind: options.spanKind || SpanKind.SERVER,
    attributes,
  });
}

/**
 * Extracts the correlation ID from a context
 */
export function extractCorrelationId(ctx: Context): string | undefined {
  return context.get(ctx, 'correlation-id');
}

/**
 * Extracts the trace context from HTTP headers
 */
export function extractContextFromHeaders(headers: Record<string, string | string[]>): Context {
  const propagator = new W3CTraceContextPropagator();
  return propagator.extract(ROOT_CONTEXT, headers, {
    get: (carrier, key) => {
      const value = carrier[key];
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    },
    keys: (carrier) => Object.keys(carrier),
  });
}

/**
 * Injects the trace context into HTTP headers
 */
export function injectContextIntoHeaders(ctx: Context, headers: Record<string, string | string[]> = {}): Record<string, string | string[]> {
  const propagator = new W3CTraceContextPropagator();
  propagator.inject(ctx, headers, {
    set: (carrier, key, value) => {
      carrier[key] = value;
    },
  });
  
  // Also inject correlation ID if present
  const correlationId = extractCorrelationId(ctx);
  if (correlationId) {
    headers['x-correlation-id'] = correlationId;
  }
  
  return headers;
}

/**
 * Creates a child context from a parent context
 */
export function createChildContext(parentContext: Context, options: TraceContextOptions = {}): Context {
  // Extract the parent span context
  const parentSpanContext = trace.getSpanContext(parentContext);
  if (!parentSpanContext) {
    throw new Error('Parent context does not contain a span context');
  }
  
  // Create a new span ID but keep the same trace ID for continuity
  const spanId = generateSpanId();
  
  // Extract correlation ID from parent if not provided
  const correlationId = options.correlationId || extractCorrelationId(parentContext) || generateCorrelationId();
  
  return createTraceContext({
    ...options,
    traceId: parentSpanContext.traceId,
    spanId,
    parentContext,
    correlationId,
  });
}

/**
 * Simulates a request context with trace information
 */
export function simulateRequestContext(journeyType: JourneyType, options: TraceContextOptions = {}): {
  context: Context;
  headers: Record<string, string | string[]>;
} {
  let ctx: Context;
  
  // Create journey-specific context
  switch (journeyType) {
    case JourneyType.HEALTH:
      ctx = createHealthJourneyContext(options);
      break;
    case JourneyType.CARE:
      ctx = createCareJourneyContext(options);
      break;
    case JourneyType.PLAN:
      ctx = createPlanJourneyContext(options);
      break;
    default:
      ctx = createTraceContext(options);
  }
  
  // Create headers with injected context
  const headers = injectContextIntoHeaders(ctx);
  
  return { context: ctx, headers };
}

/**
 * Simulates a cross-service trace propagation
 */
export function simulateCrossServiceTrace(
  sourceJourney: JourneyType,
  targetJourney: JourneyType,
  options: TraceContextOptions = {}
): {
  sourceContext: Context;
  targetContext: Context;
  headers: Record<string, string | string[]>;
} {
  // Create source context
  let sourceContext: Context;
  switch (sourceJourney) {
    case JourneyType.HEALTH:
      sourceContext = createHealthJourneyContext(options);
      break;
    case JourneyType.CARE:
      sourceContext = createCareJourneyContext(options);
      break;
    case JourneyType.PLAN:
      sourceContext = createPlanJourneyContext(options);
      break;
    default:
      sourceContext = createTraceContext(options);
  }
  
  // Inject context into headers
  const headers = injectContextIntoHeaders(sourceContext);
  
  // Extract context from headers (simulating receiving side)
  const extractedContext = extractContextFromHeaders(headers);
  
  // Create target context as child of extracted context
  let targetContext: Context;
  switch (targetJourney) {
    case JourneyType.HEALTH:
      targetContext = createHealthJourneyContext({
        ...options,
        parentContext: extractedContext,
      });
      break;
    case JourneyType.CARE:
      targetContext = createCareJourneyContext({
        ...options,
        parentContext: extractedContext,
      });
      break;
    case JourneyType.PLAN:
      targetContext = createPlanJourneyContext({
        ...options,
        parentContext: extractedContext,
      });
      break;
    default:
      targetContext = createTraceContext({
        ...options,
        parentContext: extractedContext,
      });
  }
  
  return {
    sourceContext,
    targetContext,
    headers,
  };
}

/**
 * Verifies if two contexts are part of the same trace
 */
export function areContextsRelated(ctx1: Context, ctx2: Context): boolean {
  const spanContext1 = trace.getSpanContext(ctx1);
  const spanContext2 = trace.getSpanContext(ctx2);
  
  if (!spanContext1 || !spanContext2) {
    return false;
  }
  
  return spanContext1.traceId === spanContext2.traceId;
}

/**
 * Creates a trace context with gamification-specific attributes
 */
export function createGamificationContext(options: TraceContextOptions = {}): Context {
  const attributes = {
    [SemanticAttributes.SERVICE_NAME]: 'gamification-engine',
    ...options.attributes,
  };
  
  if (options.userId) {
    attributes['user.id'] = options.userId;
  }
  
  return createTraceContext({
    ...options,
    spanName: options.spanName || 'gamification-operation',
    spanKind: options.spanKind || SpanKind.SERVER,
    attributes,
  });
}