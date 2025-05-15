/**
 * @file correlation.ts
 * @description Provides utility functions for correlating traces with logs and metrics,
 * enabling unified observability across the application.
 */

import { trace, context, SpanContext, SpanStatusCode, propagation } from '@opentelemetry/api';

/**
 * Interface for trace correlation information that can be attached to logs and metrics
 */
export interface TraceCorrelationInfo {
  /** The trace ID from the current span context */
  traceId: string;
  /** The span ID from the current span context */
  spanId: string;
  /** The trace flags from the current span context */
  traceFlags?: number;
  /** Whether the trace is sampled (derived from trace flags) */
  isSampled?: boolean;
  /** Additional journey-specific correlation information */
  journeyContext?: Record<string, unknown>;
}

/**
 * Interface for log object enrichment with trace correlation information
 */
export interface EnrichedLogContext extends TraceCorrelationInfo {
  /** Original log message */
  message: string;
  /** Log level */
  level?: string;
  /** Additional log metadata */
  [key: string]: unknown;
}

/**
 * Interface for metric enrichment with trace correlation information
 */
export interface EnrichedMetricContext extends TraceCorrelationInfo {
  /** Metric name */
  metricName: string;
  /** Metric value */
  value: number;
  /** Additional metric metadata */
  [key: string]: unknown;
}

/**
 * Extracts trace correlation information from the current active span context
 * @returns TraceCorrelationInfo object containing trace and span IDs, or undefined if no active span
 */
export function extractTraceInfo(): TraceCorrelationInfo | undefined {
  const activeSpan = trace.getSpan(context.active());
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isSampled: (spanContext.traceFlags & 0x1) === 0x1,
  };
}

/**
 * Creates a correlation object for external systems that need trace context
 * @param additionalContext - Optional additional context to include
 * @returns Object with trace correlation headers that can be sent to external systems
 */
export function createExternalCorrelationObject(
  additionalContext?: Record<string, unknown>
): Record<string, string> {
  const output: Record<string, string> = {};
  propagation.inject(context.active(), output);
  
  if (additionalContext) {
    Object.entries(additionalContext).forEach(([key, value]) => {
      output[`x-austa-${key}`] = typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
  
  return output;
}

/**
 * Enriches a log object with trace correlation information
 * @param logObject - The original log object to enrich
 * @returns EnrichedLogContext with trace information added
 */
export function enrichLogWithTraceInfo(
  logObject: Record<string, unknown>
): EnrichedLogContext {
  const traceInfo = extractTraceInfo();
  
  const enriched: EnrichedLogContext = {
    message: logObject.message as string || '',
    ...logObject,
  };
  
  if (traceInfo) {
    enriched.traceId = traceInfo.traceId;
    enriched.spanId = traceInfo.spanId;
    enriched.traceFlags = traceInfo.traceFlags;
    enriched.isSampled = traceInfo.isSampled;
  }
  
  return enriched;
}

/**
 * Enriches a metric with trace correlation information
 * @param metricName - Name of the metric
 * @param value - Value of the metric
 * @param attributes - Additional metric attributes
 * @returns EnrichedMetricContext with trace information added
 */
export function enrichMetricWithTraceInfo(
  metricName: string,
  value: number,
  attributes?: Record<string, unknown>
): EnrichedMetricContext {
  const traceInfo = extractTraceInfo();
  
  const enriched: EnrichedMetricContext = {
    metricName,
    value,
    ...attributes,
  };
  
  if (traceInfo) {
    enriched.traceId = traceInfo.traceId;
    enriched.spanId = traceInfo.spanId;
    enriched.traceFlags = traceInfo.traceFlags;
    enriched.isSampled = traceInfo.isSampled;
  }
  
  return enriched;
}

/**
 * Creates a correlation context for journey-specific tracing
 * @param journeyType - Type of journey (health, care, plan)
 * @param journeyContext - Journey-specific context information
 * @returns TraceCorrelationInfo with journey context added
 */
export function createJourneyCorrelationInfo(
  journeyType: 'health' | 'care' | 'plan',
  journeyContext: Record<string, unknown>
): TraceCorrelationInfo {
  const traceInfo = extractTraceInfo() || {
    traceId: '',
    spanId: '',
  };
  
  return {
    ...traceInfo,
    journeyContext: {
      journeyType,
      ...journeyContext,
    },
  };
}

/**
 * Records an error in the current span and enriches it with error information
 * @param error - The error to record
 * @param errorContext - Additional context about the error
 * @returns TraceCorrelationInfo with error information
 */
export function recordErrorWithTraceInfo(
  error: Error,
  errorContext?: Record<string, unknown>
): TraceCorrelationInfo {
  const activeSpan = trace.getSpan(context.active());
  const traceInfo = extractTraceInfo() || {
    traceId: '',
    spanId: '',
  };
  
  if (activeSpan) {
    activeSpan.recordException(error);
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    
    if (errorContext) {
      Object.entries(errorContext).forEach(([key, value]) => {
        activeSpan.setAttribute(`error.${key}`, value as string);
      });
    }
  }
  
  return {
    ...traceInfo,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...errorContext,
    },
  };
}

/**
 * Formats trace information for display in logs or UI
 * @param traceInfo - The trace information to format
 * @returns Formatted string representation of trace information
 */
export function formatTraceInfoForDisplay(traceInfo?: TraceCorrelationInfo): string {
  if (!traceInfo || !traceInfo.traceId) {
    return 'No trace information available';
  }
  
  return `Trace ID: ${traceInfo.traceId} | Span ID: ${traceInfo.spanId}${traceInfo.isSampled ? ' | Sampled' : ''}`;
}

// Export propagation API for convenience
export { propagation };