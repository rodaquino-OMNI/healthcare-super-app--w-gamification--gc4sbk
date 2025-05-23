/**
 * @file correlation.ts
 * @description Utility functions for correlating traces with logs and metrics, enabling unified observability across the application.
 */

import { Context, SpanContext, SpanKind, trace } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Interface for log context enrichment with trace information
 */
export interface TraceLogContext {
  'trace.id': string;
  'span.id': string;
  'trace.sampled': boolean;
  'trace.flags'?: number;
}

/**
 * Interface for metric correlation with trace information
 */
export interface TraceMetricContext {
  'trace.id': string;
  'span.id': string;
  'trace.sampled': boolean;
}

/**
 * Interface for external system correlation
 */
export interface ExternalCorrelationContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  isRemote?: boolean;
}

/**
 * Extracts the current trace and span IDs from the active context
 * @returns Object containing trace ID and span ID, or undefined if no active span
 */
export function extractCurrentTraceInfo(): TraceLogContext | undefined {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  if (!spanContext) {
    return undefined;
  }

  return {
    'trace.id': spanContext.traceId,
    'span.id': spanContext.spanId,
    'trace.sampled': (spanContext.traceFlags & 0x1) === 0x1,
    'trace.flags': spanContext.traceFlags,
  };
}

/**
 * Extracts trace information from a specific context
 * @param context The context to extract trace information from
 * @returns Object containing trace ID and span ID, or undefined if no span in context
 */
export function extractTraceInfoFromContext(context: Context): TraceLogContext | undefined {
  const spanContext = trace.getSpanContext(context);
  if (!spanContext) {
    return undefined;
  }

  return {
    'trace.id': spanContext.traceId,
    'span.id': spanContext.spanId,
    'trace.sampled': (spanContext.traceFlags & 0x1) === 0x1,
    'trace.flags': spanContext.traceFlags,
  };
}

/**
 * Enriches a log object with trace information from the current active span
 * @param logObject The log object to enrich
 * @returns The enriched log object with trace context
 */
export function enrichLogWithTraceInfo<T extends Record<string, any>>(logObject: T): T & TraceLogContext {
  const traceInfo = extractCurrentTraceInfo();
  if (!traceInfo) {
    return logObject as T & TraceLogContext;
  }

  return {
    ...logObject,
    ...traceInfo,
  };
}

/**
 * Enriches a log object with trace information from a specific context
 * @param logObject The log object to enrich
 * @param context The context containing the trace information
 * @returns The enriched log object with trace context
 */
export function enrichLogWithTraceInfoFromContext<T extends Record<string, any>>(
  logObject: T,
  context: Context
): T & TraceLogContext {
  const traceInfo = extractTraceInfoFromContext(context);
  if (!traceInfo) {
    return logObject as T & TraceLogContext;
  }

  return {
    ...logObject,
    ...traceInfo,
  };
}

/**
 * Creates a correlation object for external systems using the current active span
 * @returns Correlation object for external systems, or undefined if no active span
 */
export function createExternalCorrelationContext(): ExternalCorrelationContext | undefined {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  if (!spanContext) {
    return undefined;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: false,
  };
}

/**
 * Creates a correlation object for external systems from a specific context
 * @param context The context to extract trace information from
 * @returns Correlation object for external systems, or undefined if no span in context
 */
export function createExternalCorrelationContextFromContext(
  context: Context
): ExternalCorrelationContext | undefined {
  const spanContext = trace.getSpanContext(context);
  if (!spanContext) {
    return undefined;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: false,
  };
}

/**
 * Creates a correlation object for metrics using the current active span
 * @returns Correlation object for metrics, or undefined if no active span
 */
export function createMetricCorrelationContext(): TraceMetricContext | undefined {
  const traceInfo = extractCurrentTraceInfo();
  if (!traceInfo) {
    return undefined;
  }

  return {
    'trace.id': traceInfo['trace.id'],
    'span.id': traceInfo['span.id'],
    'trace.sampled': traceInfo['trace.sampled'],
  };
}

/**
 * Creates a correlation object for metrics from a specific context
 * @param context The context to extract trace information from
 * @returns Correlation object for metrics, or undefined if no span in context
 */
export function createMetricCorrelationContextFromContext(
  context: Context
): TraceMetricContext | undefined {
  const traceInfo = extractTraceInfoFromContext(context);
  if (!traceInfo) {
    return undefined;
  }

  return {
    'trace.id': traceInfo['trace.id'],
    'span.id': traceInfo['span.id'],
    'trace.sampled': traceInfo['trace.sampled'],
  };
}

/**
 * Extracts W3C trace context headers from the current active span
 * @returns Object containing W3C trace context headers, or undefined if no active span
 */
export function extractW3CTraceContextHeaders(): Record<string, string> | undefined {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  if (!spanContext) {
    return undefined;
  }

  // Format: 00-<trace-id>-<span-id>-<trace-flags>
  const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-0${(spanContext.traceFlags & 0x1).toString(16)}`;
  
  const headers: Record<string, string> = {
    traceparent,
  };

  // Add tracestate if available
  if (spanContext.traceState) {
    headers.tracestate = spanContext.traceState.serialize();
  }

  return headers;
}

/**
 * Adds journey-specific attributes to the current active span
 * @param journeyType The type of journey (health, care, plan)
 * @param journeyId The ID of the journey
 * @param attributes Additional attributes to add
 */
export function addJourneyAttributesToSpan(
  journeyType: 'health' | 'care' | 'plan',
  journeyId: string,
  attributes: Record<string, string | number | boolean> = {}
): void {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return;
  }

  activeSpan.setAttribute('journey.type', journeyType);
  activeSpan.setAttribute('journey.id', journeyId);
  
  // Add all additional attributes
  Object.entries(attributes).forEach(([key, value]) => {
    activeSpan.setAttribute(`journey.${key}`, value);
  });
}

/**
 * Creates a correlation ID for use in logs and metrics
 * @returns A unique correlation ID
 */
export function generateCorrelationId(): string {
  return `corr-${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;
}

/**
 * Checks if a log object has trace context
 * @param logObject The log object to check
 * @returns True if the log object has trace context, false otherwise
 */
export function hasTraceContext(logObject: Record<string, any>): boolean {
  return (
    typeof logObject['trace.id'] === 'string' &&
    typeof logObject['span.id'] === 'string' &&
    typeof logObject['trace.sampled'] === 'boolean'
  );
}

/**
 * Formats a trace ID for display (with dashes for readability)
 * @param traceId The trace ID to format
 * @returns The formatted trace ID
 */
export function formatTraceId(traceId: string): string {
  if (traceId.length !== 32) {
    return traceId;
  }
  
  // Format as 8-4-4-4-12 for readability
  return `${traceId.substring(0, 8)}-${traceId.substring(8, 12)}-${traceId.substring(12, 16)}-${traceId.substring(16, 20)}-${traceId.substring(20)}`;
}

/**
 * Creates a URL to view a trace in a tracing backend
 * @param traceId The trace ID to create a URL for
 * @param backend The tracing backend to use (default: 'datadog')
 * @returns The URL to view the trace
 */
export function createTraceViewUrl(traceId: string, backend: 'datadog' | 'jaeger' | 'zipkin' = 'datadog'): string {
  switch (backend) {
    case 'datadog':
      return `https://app.datadoghq.com/apm/trace/${traceId}`;
    case 'jaeger':
      return `http://localhost:16686/trace/${traceId}`;
    case 'zipkin':
      return `http://localhost:9411/zipkin/traces/${traceId}`;
    default:
      return `trace:${traceId}`;
  }
}