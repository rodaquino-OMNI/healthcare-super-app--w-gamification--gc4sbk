/**
 * Utilities for correlating logs with distributed traces and metrics.
 * Enables comprehensive observability across service boundaries by providing
 * functions to extract and propagate trace IDs, create correlation objects,
 * and integrate with OpenTelemetry.
 */

import { trace, context, SpanContext, SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Interface for a correlation object that can be added to logs
 * to correlate them with traces and metrics.
 */
export interface TraceCorrelationInfo {
  traceId: string;
  spanId: string;
  traceFlags?: number;
  isRemote?: boolean;
  journeyContext?: Record<string, unknown>;
}

/**
 * Interface for AWS X-Ray trace ID format
 */
export interface XRayTraceId {
  formattedId: string; // The X-Ray formatted trace ID (1-abcdef-12345678)
  timestamp: string;   // The timestamp portion (abcdef)
  randomId: string;    // The random ID portion (12345678)
}

/**
 * Gets the current trace correlation information from the active span.
 * Returns undefined if no active span is found.
 *
 * @returns The trace correlation information or undefined if no active span
 */
export function getCurrentTraceInfo(): TraceCorrelationInfo | undefined {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: spanContext.isRemote,
  };
}

/**
 * Extracts trace correlation information from a span context.
 *
 * @param spanContext The span context to extract information from
 * @returns The trace correlation information
 */
export function getTraceInfoFromSpanContext(spanContext: SpanContext): TraceCorrelationInfo {
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: spanContext.isRemote,
  };
}

/**
 * Enriches a log object with trace correlation information from the current active span.
 * If no active span is found, the log object is returned unchanged.
 *
 * @param logObject The log object to enrich
 * @returns The enriched log object with trace correlation information
 */
export function enrichLogWithTraceInfo<T extends Record<string, unknown>>(logObject: T): T & Partial<TraceCorrelationInfo> {
  const traceInfo = getCurrentTraceInfo();
  if (!traceInfo) {
    return logObject;
  }

  return {
    ...logObject,
    traceId: traceInfo.traceId,
    spanId: traceInfo.spanId,
    traceFlags: traceInfo.traceFlags,
  };
}

/**
 * Enriches a log object with journey-specific context from the current active span.
 * This adds business context to technical traces for better correlation.
 *
 * @param logObject The log object to enrich
 * @param journeyAttributes Optional additional journey attributes to include
 * @returns The enriched log object with journey context
 */
export function enrichLogWithJourneyContext<T extends Record<string, unknown>>(
  logObject: T,
  journeyAttributes?: Record<string, unknown>
): T & { journeyContext?: Record<string, unknown> } {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return logObject;
  }

  // Extract journey-specific attributes from the span
  const journeyContext: Record<string, unknown> = {};
  
  // Common journey attributes
  const journeyType = activeSpan.getAttribute('journey.type');
  const userId = activeSpan.getAttribute('user.id');
  const sessionId = activeSpan.getAttribute('session.id');
  
  if (journeyType) journeyContext['journeyType'] = journeyType;
  if (userId) journeyContext['userId'] = userId;
  if (sessionId) journeyContext['sessionId'] = sessionId;
  
  // Add any additional journey attributes
  if (journeyAttributes) {
    Object.assign(journeyContext, journeyAttributes);
  }
  
  // Only add journeyContext if it has properties
  if (Object.keys(journeyContext).length > 0) {
    return {
      ...logObject,
      journeyContext,
    };
  }
  
  return logObject;
}

/**
 * Converts an OpenTelemetry trace ID to AWS X-Ray format.
 * X-Ray format: 1-{8 digit hex}-{24 digit hex}
 * Where the first 8 digits represent a timestamp.
 *
 * @param traceId The OpenTelemetry trace ID (32-hex-character lowercase string)
 * @returns The X-Ray formatted trace ID
 */
export function convertToXRayTraceId(traceId: string): XRayTraceId {
  if (!traceId || traceId.length !== 32) {
    throw new Error('Invalid trace ID format. Expected a 32-character hex string.');
  }

  const timestamp = traceId.substring(0, 8);
  const randomId = traceId.substring(8);
  const formattedId = `1-${timestamp}-${randomId}`;

  return {
    formattedId,
    timestamp,
    randomId,
  };
}

/**
 * Converts an AWS X-Ray trace ID to OpenTelemetry format.
 *
 * @param xrayTraceId The X-Ray trace ID (1-{8 digit hex}-{24 digit hex})
 * @returns The OpenTelemetry trace ID (32-hex-character lowercase string)
 */
export function convertFromXRayTraceId(xrayTraceId: string): string {
  // X-Ray trace ID format: 1-{8 digit hex}-{24 digit hex}
  const regex = /^1-([0-9a-f]{8})-([0-9a-f]{24})$/;
  const match = xrayTraceId.match(regex);

  if (!match) {
    throw new Error('Invalid X-Ray trace ID format. Expected format: 1-{8 digit hex}-{24 digit hex}');
  }

  const timestamp = match[1];
  const randomId = match[2];
  return `${timestamp}${randomId}`;
}

/**
 * Creates a correlation object for AWS CloudWatch logs.
 * This format is compatible with AWS CloudWatch Logs Insights queries.
 *
 * @returns The CloudWatch correlation object or undefined if no active span
 */
export function createCloudWatchCorrelation(): Record<string, string> | undefined {
  const traceInfo = getCurrentTraceInfo();
  if (!traceInfo) {
    return undefined;
  }

  try {
    const xrayTraceId = convertToXRayTraceId(traceInfo.traceId);
    return {
      'xray.trace_id': xrayTraceId.formattedId,
      'otel.trace_id': traceInfo.traceId,
      'otel.span_id': traceInfo.spanId,
    };
  } catch (error) {
    // If conversion fails, return the original OpenTelemetry IDs
    return {
      'otel.trace_id': traceInfo.traceId,
      'otel.span_id': traceInfo.spanId,
    };
  }
}

/**
 * Creates a correlation object for Datadog logs.
 * This format is compatible with Datadog's trace correlation.
 *
 * @returns The Datadog correlation object or undefined if no active span
 */
export function createDatadogCorrelation(): Record<string, string> | undefined {
  const traceInfo = getCurrentTraceInfo();
  if (!traceInfo) {
    return undefined;
  }

  // Datadog uses decimal representation of the hex span ID
  const spanIdDecimal = parseInt(traceInfo.spanId, 16).toString();

  return {
    'dd.trace_id': traceInfo.traceId,
    'dd.span_id': spanIdDecimal,
  };
}

/**
 * Extracts trace correlation information from HTTP headers.
 * Supports both W3C Trace Context and AWS X-Ray header formats.
 *
 * @param headers HTTP headers object or record
 * @returns The trace correlation information or undefined if no trace headers found
 */
export function extractTraceInfoFromHeaders(headers: Record<string, string | string[] | undefined>): TraceCorrelationInfo | undefined {
  // Try W3C Trace Context format first (traceparent header)
  const traceparent = headers['traceparent'];
  if (traceparent && typeof traceparent === 'string') {
    // traceparent format: 00-traceId-spanId-flags
    const parts = traceparent.split('-');
    if (parts.length === 4) {
      return {
        traceId: parts[1],
        spanId: parts[2],
        traceFlags: parseInt(parts[3], 16),
        isRemote: true,
      };
    }
  }

  // Try AWS X-Ray header format
  const xrayHeader = headers['x-amzn-trace-id'];
  if (xrayHeader && typeof xrayHeader === 'string') {
    // X-Ray header format: Root=1-5759e988-bd862e3fe1be46a994272793;Parent=53995c3f42cd8ad8;Sampled=1
    const rootMatch = xrayHeader.match(/Root=([^;]+)/);
    const parentMatch = xrayHeader.match(/Parent=([^;]+)/);
    const sampledMatch = xrayHeader.match(/Sampled=([^;]+)/);

    if (rootMatch && rootMatch[1]) {
      try {
        const traceId = convertFromXRayTraceId(rootMatch[1]);
        return {
          traceId,
          spanId: parentMatch && parentMatch[1] ? parentMatch[1] : '0000000000000000',
          traceFlags: sampledMatch && sampledMatch[1] === '1' ? 1 : 0,
          isRemote: true,
        };
      } catch (error) {
        // If conversion fails, return undefined
        return undefined;
      }
    }
  }

  return undefined;
}

/**
 * Creates HTTP headers with trace correlation information from the current active span.
 * Generates headers in both W3C Trace Context and AWS X-Ray formats.
 *
 * @returns Object containing HTTP headers with trace correlation information
 */
export function createTraceHeaders(): Record<string, string> | undefined {
  const traceInfo = getCurrentTraceInfo();
  if (!traceInfo) {
    return undefined;
  }

  const headers: Record<string, string> = {};

  // W3C Trace Context format
  const flags = traceInfo.traceFlags?.toString(16).padStart(2, '0') || '01';
  headers['traceparent'] = `00-${traceInfo.traceId}-${traceInfo.spanId}-${flags}`;

  // AWS X-Ray format
  try {
    const xrayTraceId = convertToXRayTraceId(traceInfo.traceId);
    headers['x-amzn-trace-id'] = `Root=${xrayTraceId.formattedId};Parent=${traceInfo.spanId};Sampled=${traceInfo.traceFlags ? '1' : '0'}`;
  } catch (error) {
    // If X-Ray conversion fails, skip adding the X-Ray header
  }

  return headers;
}

/**
 * Adds error information to the current active span.
 * This helps correlate logs with traces when errors occur.
 *
 * @param error The error object
 * @param attributes Optional additional attributes to add to the span
 */
export function addErrorToActiveSpan(error: Error, attributes?: Record<string, unknown>): void {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return;
  }

  // Set error status and attributes on the span
  activeSpan.setStatus({ code: SpanStatusCode.ERROR });
  
  // Add standard error attributes
  activeSpan.setAttribute(SemanticAttributes.EXCEPTION_TYPE, error.name);
  activeSpan.setAttribute(SemanticAttributes.EXCEPTION_MESSAGE, error.message);
  
  if (error.stack) {
    activeSpan.setAttribute(SemanticAttributes.EXCEPTION_STACKTRACE, error.stack);
  }
  
  // Add any additional attributes
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      activeSpan.setAttribute(key, value as string | number | boolean);
    });
  }
  
  // Record the exception as an event
  activeSpan.recordException(error);
}

/**
 * Creates a correlation link for logs that can be used to navigate to the trace in a tracing UI.
 * The format depends on the tracing backend being used.
 *
 * @param traceId The trace ID
 * @param backend The tracing backend ('jaeger', 'zipkin', 'xray', etc.)
 * @param baseUrl Optional base URL for the tracing backend
 * @returns A URL that can be used to navigate to the trace
 */
export function createTraceLink(traceId: string, backend: 'jaeger' | 'zipkin' | 'xray' | string, baseUrl?: string): string | undefined {
  if (!traceId) {
    return undefined;
  }

  let url: string;
  switch (backend.toLowerCase()) {
    case 'jaeger':
      url = `${baseUrl || 'http://localhost:16686'}/trace/${traceId}`;
      break;
    case 'zipkin':
      url = `${baseUrl || 'http://localhost:9411'}/zipkin/traces/${traceId}`;
      break;
    case 'xray':
      // For X-Ray, we need to convert to X-Ray format if it's not already
      try {
        const xrayId = traceId.includes('-') ? traceId : convertToXRayTraceId(traceId).formattedId;
        url = `${baseUrl || 'https://console.aws.amazon.com/xray/home'}/trace/details/${xrayId}`;
      } catch (error) {
        return undefined;
      }
      break;
    default:
      // For unknown backends, just return a generic URL if baseUrl is provided
      if (baseUrl) {
        url = `${baseUrl}/trace/${traceId}`;
      } else {
        return undefined;
      }
  }

  return url;
}