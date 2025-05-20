/**
 * Utility functions for correlating traces with logs and metrics.
 * Provides methods to extract trace and span IDs from the current context
 * and enrich log objects with tracing information.
 */
import { context, trace, SpanContext, SpanStatusCode } from '@opentelemetry/api';

/**
 * Interface for correlation information extracted from the current trace context
 */
export interface TraceCorrelation {
  traceId: string;
  spanId: string;
  traceFlags?: number;
  isRemote?: boolean;
  traceState?: string;
}

/**
 * Interface for log object enrichment with trace information
 */
export interface EnrichedLogContext {
  'trace.id': string;
  'span.id': string;
  'trace.flags'?: number;
  'trace.remote'?: boolean;
  'trace.state'?: string;
}

/**
 * Extracts trace correlation information from the current active context
 * @returns TraceCorrelation object containing trace and span IDs, or undefined if no active span
 */
export function getTraceCorrelation(): TraceCorrelation | undefined {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  if (!spanContext.traceId || !spanContext.spanId) {
    return undefined;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: spanContext.isRemote,
    traceState: spanContext.traceState?.toString(),
  };
}

/**
 * Extracts trace correlation information from the current context
 * @returns TraceCorrelation object containing trace and span IDs, or undefined if no active span
 */
export function getTraceCorrelationFromContext(): TraceCorrelation | undefined {
  const currentContext = context.active();
  const currentSpan = trace.getSpan(currentContext);
  
  if (!currentSpan) {
    return undefined;
  }

  const spanContext = currentSpan.spanContext();
  if (!spanContext.traceId || !spanContext.spanId) {
    return undefined;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: spanContext.isRemote,
    traceState: spanContext.traceState?.toString(),
  };
}

/**
 * Enriches a log object with trace correlation information
 * @param logObject The log object to enrich
 * @returns The enriched log object with trace information, or the original if no active span
 */
export function enrichLogWithTraceInfo<T extends Record<string, any>>(logObject: T): T & Partial<EnrichedLogContext> {
  const correlation = getTraceCorrelation();
  if (!correlation) {
    return logObject;
  }

  return {
    ...logObject,
    'trace.id': correlation.traceId,
    'span.id': correlation.spanId,
    ...(correlation.traceFlags !== undefined && { 'trace.flags': correlation.traceFlags }),
    ...(correlation.isRemote !== undefined && { 'trace.remote': correlation.isRemote }),
    ...(correlation.traceState && { 'trace.state': correlation.traceState }),
  };
}

/**
 * Creates a correlation object for external systems using W3C trace context format
 * @returns Object with traceparent and tracestate headers, or undefined if no active span
 */
export function createExternalCorrelationHeaders(): Record<string, string> | undefined {
  const correlation = getTraceCorrelation();
  if (!correlation) {
    return undefined;
  }

  // Format according to W3C Trace Context specification
  // traceparent: 00-<trace-id>-<span-id>-<trace-flags>
  const traceFlags = (correlation.traceFlags || 0).toString(16).padStart(2, '0');
  const traceparent = `00-${correlation.traceId}-${correlation.spanId}-${traceFlags}`;
  
  const headers: Record<string, string> = {
    traceparent,
  };

  if (correlation.traceState) {
    headers.tracestate = correlation.traceState;
  }

  return headers;
}

/**
 * Creates a correlation object for metrics, allowing traces to be correlated with metrics
 * @returns Object with trace and span IDs for metrics correlation, or empty object if no active span
 */
export function createMetricsCorrelation(): Record<string, string> {
  const correlation = getTraceCorrelation();
  if (!correlation) {
    return {};
  }

  return {
    'trace_id': correlation.traceId,
    'span_id': correlation.spanId,
  };
}

/**
 * Extracts trace correlation information from a span context
 * @param spanContext The span context to extract information from
 * @returns TraceCorrelation object containing trace and span IDs
 */
export function getTraceCorrelationFromSpanContext(spanContext: SpanContext): TraceCorrelation {
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: spanContext.isRemote,
    traceState: spanContext.traceState?.toString(),
  };
}

/**
 * Determines if the current context has an active trace
 * @returns true if there is an active trace, false otherwise
 */
export function hasActiveTrace(): boolean {
  return getTraceCorrelation() !== undefined;
}