/**
 * Trace Context Utilities for E2E Testing
 * 
 * This file provides utilities for creating and manipulating trace contexts in tests.
 * It enables testing of the integration between logging and distributed tracing
 * to ensure proper correlation between logs and traces.
 */

import { Context, SpanContext, SpanKind, TraceFlags } from '@opentelemetry/api';
import { ROOT_CONTEXT, createContextKey } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

// Constants for trace context generation
const TRACE_PARENT_HEADER = 'traceparent';
const TRACE_STATE_HEADER = 'tracestate';
const SPAN_CONTEXT_KEY = createContextKey('span-context');

/**
 * Generates a random trace ID for testing purposes.
 * @returns A 32-character hex string representing a 16-byte trace ID
 */
export function generateTraceId(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generates a random span ID for testing purposes.
 * @returns A 16-character hex string representing an 8-byte span ID
 */
export function generateSpanId(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Creates a span context for testing purposes.
 * @param options Optional configuration for the span context
 * @returns A SpanContext object
 */
export function createTestSpanContext(options?: {
  traceId?: string;
  spanId?: string;
  traceFlags?: TraceFlags;
  traceState?: string;
  isRemote?: boolean;
}): SpanContext {
  return {
    traceId: options?.traceId || generateTraceId(),
    spanId: options?.spanId || generateSpanId(),
    traceFlags: options?.traceFlags || TraceFlags.SAMPLED,
    traceState: options?.traceState || '',
    isRemote: options?.isRemote || false,
  };
}

/**
 * Creates a child span context from a parent span context.
 * @param parentContext The parent span context
 * @returns A child SpanContext object with the same trace ID but a new span ID
 */
export function createChildSpanContext(parentContext: SpanContext): SpanContext {
  return {
    traceId: parentContext.traceId,
    spanId: generateSpanId(),
    traceFlags: parentContext.traceFlags,
    traceState: parentContext.traceState,
    isRemote: false,
  };
}

/**
 * Creates an OpenTelemetry context with the provided span context.
 * @param spanContext The span context to set in the OpenTelemetry context
 * @returns An OpenTelemetry Context object
 */
export function createContextWithSpan(spanContext: SpanContext): Context {
  return ROOT_CONTEXT.setValue(SPAN_CONTEXT_KEY, spanContext);
}

/**
 * Extracts a span context from an OpenTelemetry context.
 * @param context The OpenTelemetry context
 * @returns The span context or undefined if not present
 */
export function extractSpanContext(context: Context): SpanContext | undefined {
  return context.getValue(SPAN_CONTEXT_KEY);
}

/**
 * Interface for carrier objects used in context propagation.
 * @interface
 */
export interface TraceContextCarrier {
  [key: string]: string;
}

/**
 * Injects span context into a carrier object for context propagation.
 * @param context The OpenTelemetry context containing the span context
 * @param carrier The carrier object to inject the context into
 * @returns The carrier object with injected context
 */
export function injectTraceContext(context: Context, carrier: TraceContextCarrier = {}): TraceContextCarrier {
  const propagator = new W3CTraceContextPropagator();
  propagator.inject(context, carrier);
  return carrier;
}

/**
 * Extracts span context from a carrier object.
 * @param carrier The carrier object containing the propagated context
 * @returns An OpenTelemetry context with the extracted span context
 */
export function extractTraceContext(carrier: TraceContextCarrier): Context {
  const propagator = new W3CTraceContextPropagator();
  return propagator.extract(ROOT_CONTEXT, carrier);
}

/**
 * Creates a simulated HTTP headers object with trace context.
 * @param context The OpenTelemetry context containing the span context
 * @returns An object representing HTTP headers with trace context
 */
export function createTraceContextHeaders(context: Context): Record<string, string> {
  const headers: Record<string, string> = {};
  injectTraceContext(context, headers);
  return headers;
}

/**
 * Creates a complete trace context simulation for testing distributed tracing.
 * @param options Configuration options for the trace context
 * @returns An object containing all necessary trace context components
 */
export function createTraceContextSimulation(options?: {
  parentSpanContext?: SpanContext;
  spanKind?: SpanKind;
  serviceName?: string;
  operationName?: string;
}) {
  const spanContext = options?.parentSpanContext ? 
    createChildSpanContext(options.parentSpanContext) : 
    createTestSpanContext();
  
  const context = createContextWithSpan(spanContext);
  const headers = createTraceContextHeaders(context);
  
  return {
    spanContext,
    context,
    headers,
    spanKind: options?.spanKind || SpanKind.INTERNAL,
    serviceName: options?.serviceName || 'test-service',
    operationName: options?.operationName || 'test-operation',
  };
}

/**
 * Verifies if two span contexts are part of the same trace.
 * @param context1 The first span context
 * @param context2 The second span context
 * @returns True if both contexts are part of the same trace
 */
export function isSameTrace(context1: SpanContext, context2: SpanContext): boolean {
  return context1.traceId === context2.traceId;
}

/**
 * Verifies if one span context is a direct parent of another.
 * @param parentContext The potential parent span context
 * @param childContext The potential child span context
 * @returns True if parentContext is a direct parent of childContext
 */
export function isParentChild(parentContext: SpanContext, childContext: SpanContext): boolean {
  return isSameTrace(parentContext, childContext) && 
         parentContext.spanId !== childContext.spanId;
}

/**
 * Creates a trace context for a specific journey in the AUSTA SuperApp.
 * @param journeyType The type of journey (health, care, plan)
 * @param userId The user ID associated with the journey
 * @param additionalAttributes Additional journey-specific attributes
 * @returns A complete trace context simulation for the journey
 */
export function createJourneyTraceContext(
  journeyType: 'health' | 'care' | 'plan',
  userId: string,
  additionalAttributes: Record<string, string> = {}
) {
  const simulation = createTraceContextSimulation({
    serviceName: `austa-${journeyType}-service`,
    operationName: `${journeyType}-journey-operation`,
  });
  
  // Add journey-specific attributes
  const journeyAttributes = {
    'journey.type': journeyType,
    'journey.user_id': userId,
    ...additionalAttributes,
  };
  
  return {
    ...simulation,
    journeyAttributes,
  };
}

/**
 * Creates a trace context for testing gamification events.
 * @param achievementType The type of achievement being tested
 * @param userId The user ID associated with the achievement
 * @returns A trace context simulation for gamification testing
 */
export function createGamificationTraceContext(
  achievementType: string,
  userId: string
) {
  return createTraceContextSimulation({
    serviceName: 'austa-gamification-engine',
    operationName: 'process-achievement',
  });
}

/**
 * Simulates trace context propagation across multiple services.
 * @param services Array of service names to simulate
 * @returns An array of connected trace contexts across services
 */
export function simulateDistributedTrace(services: string[]): Array<{
  serviceName: string;
  context: Context;
  spanContext: SpanContext;
  headers: Record<string, string>;
}> {
  if (!services.length) {
    return [];
  }
  
  const result = [];
  let currentSimulation = createTraceContextSimulation({
    serviceName: services[0],
    operationName: `${services[0]}-operation`,
  });
  
  result.push({
    serviceName: services[0],
    context: currentSimulation.context,
    spanContext: currentSimulation.spanContext,
    headers: currentSimulation.headers,
  });
  
  // Create a chain of connected traces across services
  for (let i = 1; i < services.length; i++) {
    currentSimulation = createTraceContextSimulation({
      parentSpanContext: currentSimulation.spanContext,
      serviceName: services[i],
      operationName: `${services[i]}-operation`,
    });
    
    result.push({
      serviceName: services[i],
      context: currentSimulation.context,
      spanContext: currentSimulation.spanContext,
      headers: currentSimulation.headers,
    });
  }
  
  return result;
}