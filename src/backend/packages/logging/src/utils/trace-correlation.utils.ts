/**
 * Utilities for correlating logs with distributed traces and metrics.
 * Enables comprehensive observability across service boundaries by providing
 * functions for extracting and propagating trace context.
 */

import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';
import * as crypto from 'crypto';

// W3C Trace Context constants
const TRACE_PARENT_HEADER = 'traceparent';
const TRACE_STATE_HEADER = 'tracestate';
const X_REQUEST_ID_HEADER = 'x-request-id';
const X_CORRELATION_ID_HEADER = 'x-correlation-id';

// AWS X-Ray constants
const XRAY_TRACE_ID_HEADER = 'x-amzn-trace-id';
const XRAY_TRACE_ID_REGEX = /Root=([0-9a-f]{8}-[0-9a-f]{16}-[0-9a-f]{8})/i;

// W3C Trace Context format constants
const TRACE_PARENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/**
 * Represents a trace context according to the W3C Trace Context specification.
 */
export interface TraceContext {
  /** Trace ID as a 32-character lowercase hex string */
  traceId: string;
  /** Span ID as a 16-character lowercase hex string */
  spanId: string;
  /** Trace flags as a 2-character lowercase hex string */
  traceFlags: string;
  /** Trace state as defined by the W3C Trace Context specification */
  traceState?: string;
}

/**
 * Represents a correlation context that can be included in logs.
 */
export interface CorrelationContext {
  /** Trace ID for correlating logs with traces */
  traceId?: string;
  /** Span ID for correlating logs with specific spans */
  spanId?: string;
  /** Request ID for correlating logs with specific requests */
  requestId?: string;
  /** Correlation ID for correlating logs across services */
  correlationId?: string;
  /** Additional correlation properties */
  [key: string]: unknown;
}

/**
 * Extracts trace context from HTTP headers according to the W3C Trace Context specification.
 * 
 * @param headers - HTTP headers containing trace context
 * @returns Trace context if present, undefined otherwise
 */
export function extractTraceContextFromHeaders(headers: IncomingHttpHeaders): TraceContext | undefined {
  const traceparent = headers[TRACE_PARENT_HEADER] as string;
  if (!traceparent) {
    return undefined;
  }

  const matches = TRACE_PARENT_REGEX.exec(traceparent);
  if (!matches || matches.length !== 4) {
    return undefined;
  }

  const [, traceId, spanId, traceFlags] = matches;
  const traceState = headers[TRACE_STATE_HEADER] as string;

  return {
    traceId,
    spanId,
    traceFlags,
    traceState,
  };
}

/**
 * Extracts trace context from an Express request.
 * 
 * @param req - Express request object
 * @returns Trace context if present, undefined otherwise
 */
export function extractTraceContextFromRequest(req: Request): TraceContext | undefined {
  return extractTraceContextFromHeaders(req.headers);
}

/**
 * Extracts AWS X-Ray trace ID from HTTP headers.
 * 
 * @param headers - HTTP headers containing X-Ray trace ID
 * @returns X-Ray trace ID if present, undefined otherwise
 */
export function extractXRayTraceIdFromHeaders(headers: IncomingHttpHeaders): string | undefined {
  const xrayHeader = headers[XRAY_TRACE_ID_HEADER] as string;
  if (!xrayHeader) {
    return undefined;
  }

  const matches = XRAY_TRACE_ID_REGEX.exec(xrayHeader);
  if (!matches || matches.length !== 2) {
    return undefined;
  }

  return matches[1];
}

/**
 * Converts an AWS X-Ray trace ID to a W3C trace ID.
 * 
 * @param xrayTraceId - AWS X-Ray trace ID
 * @returns W3C trace ID as a 32-character lowercase hex string
 */
export function convertXRayToW3CTraceId(xrayTraceId: string): string | undefined {
  if (!xrayTraceId) {
    return undefined;
  }

  // X-Ray format: 1-5759e988-bd862e3fe1be46a994272793
  // or Root=1-5759e988-bd862e3fe1be46a994272793
  const matches = /^(?:Root=)?1-([0-9a-f]{8})-([0-9a-f]{24})$/i.exec(xrayTraceId);
  if (!matches || matches.length !== 3) {
    return undefined;
  }

  const [, timestamp, entityId] = matches;
  return `${timestamp}${entityId}`;
}

/**
 * Creates a correlation context from trace context and request headers.
 * 
 * @param traceContext - W3C trace context
 * @param headers - HTTP headers containing additional correlation IDs
 * @returns Correlation context for logging
 */
export function createCorrelationContext(
  traceContext?: TraceContext,
  headers?: IncomingHttpHeaders
): CorrelationContext {
  const context: CorrelationContext = {};

  // Add trace context if available
  if (traceContext) {
    context.traceId = traceContext.traceId;
    context.spanId = traceContext.spanId;
  }

  // Add request and correlation IDs from headers if available
  if (headers) {
    const requestId = headers[X_REQUEST_ID_HEADER] as string;
    const correlationId = headers[X_CORRELATION_ID_HEADER] as string;

    if (requestId) {
      context.requestId = requestId;
    }

    if (correlationId) {
      context.correlationId = correlationId;
    }

    // If no trace ID is available, try to extract from X-Ray header
    if (!context.traceId) {
      const xrayTraceId = extractXRayTraceIdFromHeaders(headers);
      if (xrayTraceId) {
        const w3cTraceId = convertXRayToW3CTraceId(xrayTraceId);
        if (w3cTraceId) {
          context.traceId = w3cTraceId;
        } else {
          // If conversion fails, use the original X-Ray trace ID
          context.traceId = xrayTraceId;
        }
      }
    }
  }

  return context;
}

/**
 * Creates a correlation context from an Express request.
 * 
 * @param req - Express request object
 * @returns Correlation context for logging
 */
export function createCorrelationContextFromRequest(req: Request): CorrelationContext {
  const traceContext = extractTraceContextFromRequest(req);
  return createCorrelationContext(traceContext, req.headers);
}

/**
 * Creates HTTP headers for propagating trace context.
 * 
 * @param traceContext - W3C trace context to propagate
 * @param additionalHeaders - Additional headers to include
 * @returns HTTP headers for context propagation
 */
export function createTraceContextHeaders(
  traceContext: TraceContext,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    ...additionalHeaders,
  };

  if (traceContext) {
    // Format: 00-<trace-id>-<span-id>-<trace-flags>
    headers[TRACE_PARENT_HEADER] = `00-${traceContext.traceId}-${traceContext.spanId}-${traceContext.traceFlags}`;
    
    if (traceContext.traceState) {
      headers[TRACE_STATE_HEADER] = traceContext.traceState;
    }
  }

  return headers;
}

/**
 * Extracts trace context from a Kafka message.
 * 
 * @param headers - Kafka message headers
 * @returns Trace context if present, undefined otherwise
 */
export function extractTraceContextFromKafkaHeaders(
  headers: Array<{ key: string; value: Buffer }>
): TraceContext | undefined {
  const traceparentHeader = headers.find(h => h.key.toLowerCase() === TRACE_PARENT_HEADER);
  if (!traceparentHeader) {
    return undefined;
  }

  const traceparent = traceparentHeader.value.toString();
  const matches = TRACE_PARENT_REGEX.exec(traceparent);
  if (!matches || matches.length !== 4) {
    return undefined;
  }

  const [, traceId, spanId, traceFlags] = matches;
  
  // Find tracestate header if present
  const tracestateHeader = headers.find(h => h.key.toLowerCase() === TRACE_STATE_HEADER);
  const traceState = tracestateHeader ? tracestateHeader.value.toString() : undefined;

  return {
    traceId,
    spanId,
    traceFlags,
    traceState,
  };
}

/**
 * Creates Kafka message headers for propagating trace context.
 * 
 * @param traceContext - W3C trace context to propagate
 * @param additionalHeaders - Additional headers to include
 * @returns Kafka message headers for context propagation
 */
export function createKafkaTraceContextHeaders(
  traceContext: TraceContext,
  additionalHeaders?: Array<{ key: string; value: Buffer }>
): Array<{ key: string; value: Buffer }> {
  const headers = additionalHeaders ? [...additionalHeaders] : [];

  if (traceContext) {
    // Format: 00-<trace-id>-<span-id>-<trace-flags>
    const traceparent = `00-${traceContext.traceId}-${traceContext.spanId}-${traceContext.traceFlags}`;
    headers.push({
      key: TRACE_PARENT_HEADER,
      value: Buffer.from(traceparent),
    });
    
    if (traceContext.traceState) {
      headers.push({
        key: TRACE_STATE_HEADER,
        value: Buffer.from(traceContext.traceState),
      });
    }
  }

  return headers;
}

/**
 * Generates a new trace ID according to the W3C Trace Context specification.
 * 
 * @returns A new trace ID as a 32-character lowercase hex string
 */
export function generateTraceId(): string {
  return generateRandomHex(32);
}

/**
 * Generates a new span ID according to the W3C Trace Context specification.
 * 
 * @returns A new span ID as a 16-character lowercase hex string
 */
export function generateSpanId(): string {
  return generateRandomHex(16);
}

/**
 * Generates a random hex string of the specified length.
 * 
 * @param length - Length of the hex string to generate
 * @returns Random hex string
 */
function generateRandomHex(length: number): string {
  const bytes = crypto.randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').substring(0, length);
}

/**
 * Checks if a trace context is valid according to the W3C Trace Context specification.
 * 
 * @param traceContext - Trace context to validate
 * @returns True if the trace context is valid, false otherwise
 */
export function isValidTraceContext(traceContext?: TraceContext): boolean {
  if (!traceContext) {
    return false;
  }

  // Trace ID must be a 32-character lowercase hex string with at least one non-zero byte
  const isValidTraceId = /^[0-9a-f]{32}$/i.test(traceContext.traceId) && traceContext.traceId !== '00000000000000000000000000000000';
  
  // Span ID must be a 16-character lowercase hex string with at least one non-zero byte
  const isValidSpanId = /^[0-9a-f]{16}$/i.test(traceContext.spanId) && traceContext.spanId !== '0000000000000000';
  
  // Trace flags must be a 2-character lowercase hex string
  const isValidTraceFlags = /^[0-9a-f]{2}$/i.test(traceContext.traceFlags);

  return isValidTraceId && isValidSpanId && isValidTraceFlags;
}

/**
 * Creates a correlation object for OpenTelemetry logs.
 * 
 * @param traceContext - W3C trace context
 * @returns Correlation object for OpenTelemetry logs
 */
export function createOpenTelemetryCorrelation(traceContext?: TraceContext): Record<string, string> {
  if (!traceContext || !isValidTraceContext(traceContext)) {
    return {};
  }

  return {
    'trace_id': traceContext.traceId,
    'span_id': traceContext.spanId,
    'trace_flags': traceContext.traceFlags,
  };
}

/**
 * Extracts trace context from OpenTelemetry context.
 * This is a placeholder function that should be implemented when integrating with OpenTelemetry.
 * 
 * @returns Trace context if available, undefined otherwise
 */
export function extractTraceContextFromOpenTelemetry(): TraceContext | undefined {
  // This function should be implemented when integrating with OpenTelemetry
  // It should extract the current trace context from the OpenTelemetry context
  return undefined;
}

/**
 * Enriches a log object with trace correlation information.
 * 
 * @param logObject - Log object to enrich
 * @param correlationContext - Correlation context to add to the log object
 * @returns Enriched log object
 */
export function enrichLogWithCorrelation(
  logObject: Record<string, unknown>,
  correlationContext: CorrelationContext
): Record<string, unknown> {
  if (!correlationContext) {
    return logObject;
  }

  return {
    ...logObject,
    trace: {
      ...correlationContext,
      ...(logObject.trace as Record<string, unknown> || {}),
    },
  };
}

/**
 * Extracts trace context from the current execution context.
 * This function attempts to extract trace context from various sources,
 * including OpenTelemetry, HTTP headers, and Kafka headers.
 * 
 * @param source - Optional source object (e.g., HTTP request, Kafka message)
 * @returns Trace context if available, undefined otherwise
 */
export function extractTraceContextFromCurrentContext(source?: unknown): TraceContext | undefined {
  // First, try to extract from OpenTelemetry context
  const otelContext = extractTraceContextFromOpenTelemetry();
  if (otelContext) {
    return otelContext;
  }

  // If a source is provided, try to extract from it
  if (source) {
    // Check if source is an Express request
    if (isExpressRequest(source)) {
      return extractTraceContextFromRequest(source);
    }

    // Check if source is Kafka headers
    if (isKafkaHeaders(source)) {
      return extractTraceContextFromKafkaHeaders(source);
    }

    // Check if source is HTTP headers
    if (isHttpHeaders(source)) {
      return extractTraceContextFromHeaders(source);
    }
  }

  return undefined;
}

/**
 * Type guard for Express request objects.
 * 
 * @param source - Object to check
 * @returns True if the object is an Express request, false otherwise
 */
function isExpressRequest(source: unknown): source is Request {
  return (
    typeof source === 'object' &&
    source !== null &&
    'headers' in source &&
    'method' in source &&
    'url' in source
  );
}

/**
 * Type guard for HTTP headers objects.
 * 
 * @param source - Object to check
 * @returns True if the object is an HTTP headers object, false otherwise
 */
function isHttpHeaders(source: unknown): source is IncomingHttpHeaders {
  return (
    typeof source === 'object' &&
    source !== null &&
    !Array.isArray(source)
  );
}

/**
 * Type guard for Kafka headers arrays.
 * 
 * @param source - Object to check
 * @returns True if the object is a Kafka headers array, false otherwise
 */
function isKafkaHeaders(source: unknown): source is Array<{ key: string; value: Buffer }> {
  return (
    Array.isArray(source) &&
    source.length > 0 &&
    typeof source[0] === 'object' &&
    source[0] !== null &&
    'key' in source[0] &&
    'value' in source[0] &&
    Buffer.isBuffer((source[0] as any).value)
  );
}