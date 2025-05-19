/**
 * Utilities for correlating logs with distributed traces and metrics.
 * Enables comprehensive observability across service boundaries by providing
 * functions for extracting and propagating trace IDs, creating correlation objects,
 * and integrating with OpenTelemetry.
 */

import { trace, context, SpanContext, SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';

/**
 * Interface for trace correlation data that can be attached to logs
 */
export interface TraceCorrelationInfo {
  traceId: string;
  spanId: string;
  traceFlags?: number;
  isRemote?: boolean;
  journeyContext?: string;
}

/**
 * Interface for extended correlation data including additional context
 */
export interface ExtendedCorrelationInfo extends TraceCorrelationInfo {
  parentSpanId?: string;
  serviceName?: string;
  resourceAttributes?: Record<string, string | number | boolean>;
  xrayTraceId?: string; // AWS X-Ray format of trace ID
}

/**
 * Constants for trace header names across different formats
 */
export const TRACE_HEADER_NAMES = {
  W3C_TRACE_PARENT: 'traceparent',
  W3C_TRACE_STATE: 'tracestate',
  X_B3_TRACE_ID: 'x-b3-traceid',
  X_B3_SPAN_ID: 'x-b3-spanid',
  X_B3_PARENT_SPAN_ID: 'x-b3-parentspanid',
  X_B3_SAMPLED: 'x-b3-sampled',
  X_REQUEST_ID: 'x-request-id',
  X_CORRELATION_ID: 'x-correlation-id',
  AWS_XRAY_TRACE_ID: 'x-amzn-trace-id',
};

/**
 * Extracts trace correlation information from the current active span context
 * @returns TraceCorrelationInfo object or undefined if no active span
 */
export function getTraceInfoFromCurrentContext(): TraceCorrelationInfo | undefined {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const spanContext = activeSpan.spanContext();
  if (!spanContext || !spanContext.traceId) {
    return undefined;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
    isRemote: spanContext.isRemote,
  };
}

/**
 * Creates an extended correlation info object with additional context
 * @returns ExtendedCorrelationInfo object or undefined if no active span
 */
export function getExtendedTraceInfo(): ExtendedCorrelationInfo | undefined {
  const basicInfo = getTraceInfoFromCurrentContext();
  if (!basicInfo) {
    return undefined;
  }

  // Convert OpenTelemetry trace ID to AWS X-Ray format if needed
  // X-Ray format: 1-<time in seconds>-<96-bit identifier>
  const xrayTraceId = convertToXRayTraceId(basicInfo.traceId);

  return {
    ...basicInfo,
    xrayTraceId,
    // Additional context could be added here from resource attributes
  };
}

/**
 * Converts an OpenTelemetry trace ID to AWS X-Ray format
 * @param traceId OpenTelemetry trace ID (32-character hex string)
 * @returns AWS X-Ray formatted trace ID
 */
export function convertToXRayTraceId(traceId: string): string {
  if (!traceId || traceId.length !== 32) {
    return '';
  }

  // X-Ray trace IDs have the format: 1-<time in seconds>-<96-bit identifier>
  // We'll use the first 8 chars of the trace ID as the time component
  // and the remaining 24 chars as the identifier
  const timeHex = traceId.substring(0, 8);
  const idPart = traceId.substring(8);
  const timeSeconds = parseInt(timeHex, 16);

  return `1-${timeSeconds.toString(16).padStart(8, '0')}-${idPart}`;
}

/**
 * Extracts trace correlation information from HTTP headers
 * @param headers HTTP headers object
 * @returns TraceCorrelationInfo object or undefined if no trace headers found
 */
export function getTraceInfoFromHeaders(headers: IncomingHttpHeaders): TraceCorrelationInfo | undefined {
  // Try W3C Trace Context format first (standard)
  const traceparent = headers[TRACE_HEADER_NAMES.W3C_TRACE_PARENT] as string;
  if (traceparent) {
    // traceparent format: 00-<trace-id>-<span-id>-<trace-flags>
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

  // Try B3 format (used by Zipkin)
  const b3TraceId = headers[TRACE_HEADER_NAMES.X_B3_TRACE_ID] as string;
  const b3SpanId = headers[TRACE_HEADER_NAMES.X_B3_SPAN_ID] as string;
  if (b3TraceId && b3SpanId) {
    return {
      traceId: b3TraceId,
      spanId: b3SpanId,
      isRemote: true,
    };
  }

  // Try AWS X-Ray format
  const xrayHeader = headers[TRACE_HEADER_NAMES.AWS_XRAY_TRACE_ID] as string;
  if (xrayHeader) {
    // X-Ray format: Root=1-5f85e83e-884aa8d89a5f84a3046e6c11;Parent=5fa08c4d3b03a8f3;Sampled=1
    const rootMatch = xrayHeader.match(/Root=([^;]+)/);
    const parentMatch = xrayHeader.match(/Parent=([^;]+)/);
    
    if (rootMatch && rootMatch[1] && parentMatch && parentMatch[1]) {
      // Convert X-Ray trace ID to OpenTelemetry format
      // X-Ray: 1-<time in seconds>-<96-bit identifier>
      // OpenTelemetry: <32-character hex string>
      const xrayId = rootMatch[1];
      const parts = xrayId.split('-');
      if (parts.length === 3 && parts[0] === '1') {
        const timeHex = parts[1];
        const idPart = parts[2];
        const traceId = timeHex + idPart.padEnd(24, '0');
        
        return {
          traceId,
          spanId: parentMatch[1],
          isRemote: true,
        };
      }
    }
  }

  return undefined;
}

/**
 * Extracts trace correlation information from an Express Request object
 * @param req Express Request object
 * @returns TraceCorrelationInfo object or undefined if no trace info found
 */
export function getTraceInfoFromRequest(req: Request): TraceCorrelationInfo | undefined {
  // First try to get from headers
  const headerInfo = getTraceInfoFromHeaders(req.headers);
  if (headerInfo) {
    return headerInfo;
  }

  // Then check if there's trace info in the request object (might be added by middleware)
  if (req['traceInfo']) {
    return req['traceInfo'] as TraceCorrelationInfo;
  }

  // Finally, try to get from current context (might be set by instrumentation)
  return getTraceInfoFromCurrentContext();
}

/**
 * Creates HTTP headers with trace correlation information
 * @param traceInfo Trace correlation information
 * @returns Object with trace headers
 */
export function createTraceHeaders(traceInfo: TraceCorrelationInfo): Record<string, string> {
  if (!traceInfo || !traceInfo.traceId || !traceInfo.spanId) {
    return {};
  }

  const headers: Record<string, string> = {};
  
  // Add W3C Trace Context headers (standard)
  const flags = traceInfo.traceFlags !== undefined ? traceInfo.traceFlags.toString(16).padStart(2, '0') : '01';
  headers[TRACE_HEADER_NAMES.W3C_TRACE_PARENT] = `00-${traceInfo.traceId}-${traceInfo.spanId}-${flags}`;
  
  // Add B3 headers for compatibility with Zipkin-based systems
  headers[TRACE_HEADER_NAMES.X_B3_TRACE_ID] = traceInfo.traceId;
  headers[TRACE_HEADER_NAMES.X_B3_SPAN_ID] = traceInfo.spanId;
  
  // Add AWS X-Ray compatible header if we have an X-Ray trace ID
  if ('xrayTraceId' in traceInfo && traceInfo['xrayTraceId']) {
    headers[TRACE_HEADER_NAMES.AWS_XRAY_TRACE_ID] = 
      `Root=${traceInfo['xrayTraceId']};Parent=${traceInfo.spanId};Sampled=1`;
  } else {
    // Convert to X-Ray format
    const xrayId = convertToXRayTraceId(traceInfo.traceId);
    if (xrayId) {
      headers[TRACE_HEADER_NAMES.AWS_XRAY_TRACE_ID] = 
        `Root=${xrayId};Parent=${traceInfo.spanId};Sampled=1`;
    }
  }
  
  return headers;
}

/**
 * Enriches a log object with trace correlation information
 * @param logObject The log object to enrich
 * @returns The enriched log object with trace correlation information
 */
export function enrichLogWithTraceInfo<T extends Record<string, any>>(logObject: T): T {
  const traceInfo = getTraceInfoFromCurrentContext();
  if (!traceInfo) {
    return logObject;
  }

  return {
    ...logObject,
    trace_id: traceInfo.traceId,
    span_id: traceInfo.spanId,
    trace_flags: traceInfo.traceFlags,
  };
}

/**
 * Enriches a log object with journey-specific trace context
 * @param logObject The log object to enrich
 * @param journeyType The type of journey (health, care, plan)
 * @param journeyContext Additional journey-specific context
 * @returns The enriched log object with journey context
 */
export function enrichLogWithJourneyContext<T extends Record<string, any>>(
  logObject: T,
  journeyType: 'health' | 'care' | 'plan',
  journeyContext: Record<string, any>
): T {
  const withTraceInfo = enrichLogWithTraceInfo(logObject);
  
  return {
    ...withTraceInfo,
    journey_type: journeyType,
    journey_context: journeyContext,
  };
}

/**
 * Creates a correlation object for Kafka messages
 * @returns Object with trace correlation information for Kafka headers
 */
export function createKafkaTraceContext(): Record<string, Buffer> {
  const traceInfo = getTraceInfoFromCurrentContext();
  if (!traceInfo) {
    return {};
  }

  // Kafka headers need to be buffers
  return {
    'traceparent': Buffer.from(`00-${traceInfo.traceId}-${traceInfo.spanId}-01`),
    'trace_id': Buffer.from(traceInfo.traceId),
    'span_id': Buffer.from(traceInfo.spanId),
  };
}

/**
 * Extracts trace correlation information from Kafka message headers
 * @param headers Kafka message headers
 * @returns TraceCorrelationInfo object or undefined if no trace headers found
 */
export function getTraceInfoFromKafkaHeaders(headers: Record<string, Buffer>): TraceCorrelationInfo | undefined {
  if (!headers) {
    return undefined;
  }

  // Try traceparent header first
  if (headers['traceparent']) {
    const traceparent = headers['traceparent'].toString();
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

  // Try individual trace_id and span_id headers
  if (headers['trace_id'] && headers['span_id']) {
    return {
      traceId: headers['trace_id'].toString(),
      spanId: headers['span_id'].toString(),
      isRemote: true,
    };
  }

  return undefined;
}

/**
 * Adds error information to the current active span
 * @param error The error object
 * @param errorContext Additional context about the error
 */
export function addErrorToActiveSpan(error: Error, errorContext?: Record<string, any>): void {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) {
    return;
  }

  activeSpan.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });

  activeSpan.setAttribute(SemanticAttributes.EXCEPTION_TYPE, error.name);
  activeSpan.setAttribute(SemanticAttributes.EXCEPTION_MESSAGE, error.message);
  
  if (error.stack) {
    activeSpan.setAttribute(SemanticAttributes.EXCEPTION_STACKTRACE, error.stack);
  }

  // Add additional error context if provided
  if (errorContext) {
    Object.entries(errorContext).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        activeSpan.setAttribute(`error.context.${key}`, value);
      }
    });
  }

  // Record the error as a span event
  activeSpan.recordException(error);
}