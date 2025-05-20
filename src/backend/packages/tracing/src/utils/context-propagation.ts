import { Context, SpanContext, trace, context, propagation } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { KafkaMessage } from 'kafkajs';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';

/**
 * Utility functions for propagating trace context across service boundaries.
 * This enables end-to-end tracing by providing methods to extract and inject
 * trace context into various transport mechanisms including HTTP headers and Kafka messages.
 */

/**
 * HTTP header carrier for OpenTelemetry context propagation
 */
export interface HttpHeadersCarrier {
  get(key: string): string | string[] | undefined;
  set(key: string, value: string): void;
}

/**
 * Kafka message carrier for OpenTelemetry context propagation
 */
export interface KafkaMessageCarrier {
  headers: Record<string, string | Buffer | null>;
}

/**
 * Journey-specific context information
 */
export interface JourneyContext {
  journeyType: 'health' | 'care' | 'plan';
  journeyId: string;
  userId?: string;
  sessionId?: string;
}

// Default propagator using W3C Trace Context
const defaultPropagator = new W3CTraceContextPropagator();

/**
 * Adapter for HTTP headers to work with OpenTelemetry context propagation
 * @param headers HTTP headers object
 * @returns HttpHeadersCarrier compatible with OpenTelemetry
 */
export function createHttpHeadersCarrier(headers: IncomingHttpHeaders | OutgoingHttpHeaders): HttpHeadersCarrier {
  return {
    get(key: string): string | string[] | undefined {
      const value = headers[key.toLowerCase()];
      if (value === undefined) return undefined;
      return value;
    },
    set(key: string, value: string): void {
      headers[key.toLowerCase()] = value;
    },
  };
}

/**
 * Adapter for Kafka message headers to work with OpenTelemetry context propagation
 * @param message Kafka message object
 * @returns KafkaMessageCarrier compatible with OpenTelemetry
 */
export function createKafkaMessageCarrier(message: KafkaMessage): KafkaMessageCarrier {
  const headers = message.headers || {};
  return {
    headers: Object.entries(headers).reduce((acc, [key, value]) => {
      if (value !== null) {
        acc[key] = value instanceof Buffer ? value : Buffer.from(String(value));
      } else {
        acc[key] = null;
      }
      return acc;
    }, {} as Record<string, string | Buffer | null>),
  };
}

/**
 * Extracts trace context from HTTP headers
 * @param headers HTTP headers containing trace context
 * @returns Context object with extracted trace information
 */
export function extractContextFromHttpHeaders(headers: IncomingHttpHeaders): Context {
  const carrier = createHttpHeadersCarrier(headers);
  return defaultPropagator.extract(context.active(), carrier);
}

/**
 * Injects the current trace context into HTTP headers
 * @param headers HTTP headers object to inject trace context into
 * @param ctx Optional context to use instead of the active context
 */
export function injectContextIntoHttpHeaders(headers: OutgoingHttpHeaders, ctx?: Context): void {
  const carrier = createHttpHeadersCarrier(headers);
  defaultPropagator.inject(ctx || context.active(), carrier);
}

/**
 * Extracts trace context from Kafka message headers
 * @param message Kafka message containing trace context in headers
 * @returns Context object with extracted trace information
 */
export function extractContextFromKafkaMessage(message: KafkaMessage): Context {
  const carrier = createKafkaMessageCarrier(message);
  
  // Custom getter for Kafka message headers
  const getter = {
    get(carrier: KafkaMessageCarrier, key: string) {
      const value = carrier.headers[key];
      if (value === undefined || value === null) return undefined;
      return value instanceof Buffer ? value.toString() : String(value);
    },
    keys(carrier: KafkaMessageCarrier) {
      return Object.keys(carrier.headers);
    },
  };
  
  return propagation.extract(context.active(), carrier, getter);
}

/**
 * Injects the current trace context into Kafka message headers
 * @param message Kafka message to inject trace context into
 * @param ctx Optional context to use instead of the active context
 */
export function injectContextIntoKafkaMessage(message: KafkaMessage, ctx?: Context): void {
  const carrier = createKafkaMessageCarrier(message);
  
  // Custom setter for Kafka message headers
  const setter = {
    set(carrier: KafkaMessageCarrier, key: string, value: string) {
      carrier.headers[key] = value;
    },
  };
  
  propagation.inject(ctx || context.active(), carrier, setter);
}

/**
 * Serializes trace context to a string for storage or transmission
 * @param ctx Context to serialize
 * @returns Serialized context as a string
 */
export function serializeContext(ctx: Context): string {
  const spanContext = trace.getSpan(ctx)?.spanContext();
  if (!spanContext) return '';
  
  return JSON.stringify({
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    traceState: spanContext.traceState?.serialize() || '',
    isRemote: spanContext.isRemote,
  });
}

/**
 * Deserializes a string back into a trace context
 * @param serialized Serialized context string
 * @returns Deserialized Context object
 */
export function deserializeContext(serialized: string): Context {
  if (!serialized) return context.active();
  
  try {
    const parsed = JSON.parse(serialized) as SpanContext;
    const spanContext: SpanContext = {
      traceId: parsed.traceId,
      spanId: parsed.spanId,
      traceFlags: parsed.traceFlags,
      isRemote: true,
    };
    
    return trace.setSpanContext(context.active(), spanContext);
  } catch (error) {
    console.error('Failed to deserialize context:', error);
    return context.active();
  }
}

/**
 * Adds journey-specific context to the current trace context
 * @param journeyContext Journey context information
 * @param ctx Optional context to use instead of the active context
 * @returns Context with journey information
 */
export function addJourneyContext(journeyContext: JourneyContext, ctx?: Context): Context {
  const currentCtx = ctx || context.active();
  const span = trace.getSpan(currentCtx);
  
  if (span) {
    // Add journey-specific attributes to the current span
    span.setAttribute('journey.type', journeyContext.journeyType);
    span.setAttribute('journey.id', journeyContext.journeyId);
    
    if (journeyContext.userId) {
      span.setAttribute('user.id', journeyContext.userId);
    }
    
    if (journeyContext.sessionId) {
      span.setAttribute('session.id', journeyContext.sessionId);
    }
  }
  
  return currentCtx;
}

/**
 * Extracts journey context from the current trace context
 * @param ctx Optional context to use instead of the active context
 * @returns Journey context information if available
 */
export function extractJourneyContext(ctx?: Context): JourneyContext | undefined {
  const currentCtx = ctx || context.active();
  const span = trace.getSpan(currentCtx);
  
  if (!span) return undefined;
  
  const journeyType = span.attributes['journey.type'] as 'health' | 'care' | 'plan';
  const journeyId = span.attributes['journey.id'] as string;
  
  if (!journeyType || !journeyId) return undefined;
  
  return {
    journeyType,
    journeyId,
    userId: span.attributes['user.id'] as string | undefined,
    sessionId: span.attributes['session.id'] as string | undefined,
  };
}

/**
 * Creates a new context with health journey information
 * @param journeyId Unique identifier for the health journey
 * @param userId Optional user identifier
 * @param sessionId Optional session identifier
 * @param ctx Optional context to use instead of the active context
 * @returns Context with health journey information
 */
export function createHealthJourneyContext(journeyId: string, userId?: string, sessionId?: string, ctx?: Context): Context {
  return addJourneyContext(
    {
      journeyType: 'health',
      journeyId,
      userId,
      sessionId,
    },
    ctx
  );
}

/**
 * Creates a new context with care journey information
 * @param journeyId Unique identifier for the care journey
 * @param userId Optional user identifier
 * @param sessionId Optional session identifier
 * @param ctx Optional context to use instead of the active context
 * @returns Context with care journey information
 */
export function createCareJourneyContext(journeyId: string, userId?: string, sessionId?: string, ctx?: Context): Context {
  return addJourneyContext(
    {
      journeyType: 'care',
      journeyId,
      userId,
      sessionId,
    },
    ctx
  );
}

/**
 * Creates a new context with plan journey information
 * @param journeyId Unique identifier for the plan journey
 * @param userId Optional user identifier
 * @param sessionId Optional session identifier
 * @param ctx Optional context to use instead of the active context
 * @returns Context with plan journey information
 */
export function createPlanJourneyContext(journeyId: string, userId?: string, sessionId?: string, ctx?: Context): Context {
  return addJourneyContext(
    {
      journeyType: 'plan',
      journeyId,
      userId,
      sessionId,
    },
    ctx
  );
}