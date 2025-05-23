/**
 * Context Propagation Utilities
 * 
 * This module provides utilities for propagating trace context across service boundaries
 * in distributed systems. It enables end-to-end tracing by offering methods to extract
 * and inject trace context into various transport mechanisms including HTTP headers
 * and Kafka messages.
 */

import { context, propagation, trace, Context, SpanContext } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { KafkaMessage, Message, ProducerRecord } from 'kafkajs';

/**
 * Journey types supported by the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for journey-specific context
 */
export interface JourneyContext {
  journeyType: JourneyType;
  journeyId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: string | undefined;
}

/**
 * Constants for header names
 */
export const TRACE_HEADER_NAMES = {
  TRACE_PARENT: 'traceparent',
  TRACE_STATE: 'tracestate',
  BAGGAGE: 'baggage',
  JOURNEY_CONTEXT: 'x-austa-journey-context',
};

/**
 * HTTP header carrier for trace context
 */
export interface HttpHeadersCarrier {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  keys?(): string[];
}

/**
 * Kafka message carrier for trace context
 */
export class KafkaMessageCarrier {
  private headers: Record<string, string> = {};

  constructor(private readonly message: KafkaMessage | Message | ProducerRecord) {}

  get(key: string): string | undefined {
    if (!this.message.headers) return undefined;

    const header = this.message.headers[key];
    if (!header) return undefined;

    // Handle different types of header values
    if (typeof header === 'string') {
      return header;
    } else if (header instanceof Buffer) {
      return header.toString('utf8');
    } else if (Array.isArray(header) && header.length > 0) {
      const firstValue = header[0];
      if (typeof firstValue === 'string') {
        return firstValue;
      } else if (firstValue instanceof Buffer) {
        return firstValue.toString('utf8');
      }
    }

    return undefined;
  }

  set(key: string, value: string): void {
    if (!this.message.headers) {
      this.message.headers = {};
    }
    this.message.headers[key] = value;
  }

  keys(): string[] {
    if (!this.message.headers) return [];
    return Object.keys(this.message.headers);
  }
}

/**
 * Default propagator for trace context
 */
const defaultPropagator = new W3CTraceContextPropagator();

/**
 * Extracts trace context from HTTP headers
 * 
 * @param headers - HTTP headers containing trace context
 * @returns Context object with extracted trace context
 */
export function extractContextFromHttpHeaders(headers: HttpHeadersCarrier): Context {
  return propagation.extract(context.active(), headers);
}

/**
 * Injects trace context into HTTP headers
 * 
 * @param ctx - Context containing trace context to inject
 * @param headers - HTTP headers to inject trace context into
 */
export function injectContextIntoHttpHeaders(ctx: Context, headers: HttpHeadersCarrier): void {
  propagation.inject(ctx, headers);
}

/**
 * Extracts trace context from Kafka message headers
 * 
 * @param message - Kafka message containing trace context in headers
 * @returns Context object with extracted trace context
 */
export function extractContextFromKafkaMessage(message: KafkaMessage | Message): Context {
  const carrier = new KafkaMessageCarrier(message);
  return propagation.extract(context.active(), carrier);
}

/**
 * Injects trace context into Kafka message headers
 * 
 * @param ctx - Context containing trace context to inject
 * @param message - Kafka message to inject trace context into
 */
export function injectContextIntoKafkaMessage(ctx: Context, message: Message | ProducerRecord): void {
  const carrier = new KafkaMessageCarrier(message);
  propagation.inject(ctx, carrier);
}

/**
 * Serializes trace context to a string
 * 
 * @param ctx - Context to serialize
 * @returns Serialized trace context as a string
 */
export function serializeContext(ctx: Context): string {
  const carrier: Record<string, string> = {};
  propagation.inject(ctx, carrier);
  return JSON.stringify(carrier);
}

/**
 * Deserializes trace context from a string
 * 
 * @param serializedContext - Serialized trace context string
 * @returns Deserialized Context object
 */
export function deserializeContext(serializedContext: string): Context {
  try {
    const carrier = JSON.parse(serializedContext) as Record<string, string>;
    return propagation.extract(context.active(), carrier);
  } catch (error) {
    console.error('Failed to deserialize context:', error);
    return context.active();
  }
}

/**
 * Creates a journey-specific context with trace context
 * 
 * @param journeyType - Type of journey (health, care, plan)
 * @param journeyContext - Additional journey-specific context
 * @returns Context with journey information
 */
export function createJourneyContext(
  journeyType: JourneyType,
  journeyContext: Partial<JourneyContext> = {}
): Context {
  const ctx = context.active();
  const fullJourneyContext: JourneyContext = {
    journeyType,
    ...journeyContext,
  };
  
  // Store journey context in baggage
  const carrier: Record<string, string> = {};
  carrier[TRACE_HEADER_NAMES.JOURNEY_CONTEXT] = JSON.stringify(fullJourneyContext);
  
  return propagation.extract(ctx, carrier);
}

/**
 * Extracts journey-specific context from the current context
 * 
 * @param ctx - Context containing journey information
 * @returns Journey context if available, undefined otherwise
 */
export function extractJourneyContext(ctx: Context = context.active()): JourneyContext | undefined {
  const carrier: Record<string, string> = {};
  propagation.inject(ctx, carrier);
  
  const journeyContextStr = carrier[TRACE_HEADER_NAMES.JOURNEY_CONTEXT];
  if (!journeyContextStr) return undefined;
  
  try {
    return JSON.parse(journeyContextStr) as JourneyContext;
  } catch (error) {
    console.error('Failed to parse journey context:', error);
    return undefined;
  }
}

/**
 * Gets the current trace ID from the active context
 * 
 * @returns Current trace ID or undefined if not available
 */
export function getCurrentTraceId(): string | undefined {
  const spanContext = trace.getSpanContext(context.active());
  return spanContext?.traceId;
}

/**
 * Gets the current span ID from the active context
 * 
 * @returns Current span ID or undefined if not available
 */
export function getCurrentSpanId(): string | undefined {
  const spanContext = trace.getSpanContext(context.active());
  return spanContext?.spanId;
}

/**
 * Creates a correlation ID for logs and metrics based on trace and span IDs
 * 
 * @param ctx - Context to extract correlation ID from
 * @returns Correlation ID string
 */
export function getCorrelationId(ctx: Context = context.active()): string {
  const spanContext = trace.getSpanContext(ctx);
  if (spanContext) {
    return `${spanContext.traceId}.${spanContext.spanId}`;
  }
  
  // Generate a random ID if no span context is available
  return `no-trace.${Math.random().toString(36).substring(2, 15)}`;
}