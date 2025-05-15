/**
 * Utilities for creating and manipulating trace contexts in tests.
 * These utilities help simulate distributed tracing environments and
 * verify proper correlation between logs and traces.
 */

import { randomBytes } from 'crypto';

/**
 * Standard length for trace and span IDs according to W3C TraceContext specification
 */
export const TRACE_ID_LENGTH_BYTES = 16; // 128-bit
export const SPAN_ID_LENGTH_BYTES = 8;  // 64-bit

/**
 * Represents a trace context according to the W3C TraceContext specification
 */
export interface TraceContext {
  traceId: string;  // 32-character lowercase hex string
  spanId: string;   // 16-character lowercase hex string
  traceFlags?: number; // Default: 0x01 (sampled)
  traceState?: string; // W3C TraceState format
  isRemote?: boolean; // Whether this context was received from a remote source
}

/**
 * Generates a random trace ID as a 32-character lowercase hex string
 * @returns A valid trace ID string
 */
export function generateTraceId(): string {
  return randomBytes(TRACE_ID_LENGTH_BYTES).toString('hex');
}

/**
 * Generates a random span ID as a 16-character lowercase hex string
 * @returns A valid span ID string
 */
export function generateSpanId(): string {
  return randomBytes(SPAN_ID_LENGTH_BYTES).toString('hex');
}

/**
 * Creates a new trace context with random trace and span IDs
 * @param options Optional parameters to customize the trace context
 * @returns A complete trace context object
 */
export function createTraceContext(options?: Partial<TraceContext>): TraceContext {
  return {
    traceId: options?.traceId || generateTraceId(),
    spanId: options?.spanId || generateSpanId(),
    traceFlags: options?.traceFlags !== undefined ? options.traceFlags : 0x01, // Default to sampled
    traceState: options?.traceState,
    isRemote: options?.isRemote || false
  };
}

/**
 * Creates a child span context from a parent context
 * @param parentContext The parent trace context
 * @returns A new trace context with the same trace ID but a new span ID
 */
export function createChildSpanContext(parentContext: TraceContext): TraceContext {
  return {
    traceId: parentContext.traceId,
    spanId: generateSpanId(),
    traceFlags: parentContext.traceFlags,
    traceState: parentContext.traceState,
    isRemote: false
  };
}

/**
 * Simulates context propagation across service boundaries
 * @param context The trace context to propagate
 * @returns A new trace context marked as remote
 */
export function propagateTraceContext(context: TraceContext): TraceContext {
  return {
    ...context,
    isRemote: true
  };
}

/**
 * Formats a trace context as HTTP headers according to W3C TraceContext specification
 * @param context The trace context to format
 * @returns An object containing traceparent and tracestate headers
 */
export function formatAsTraceParentHeader(context: TraceContext): Record<string, string> {
  const headers: Record<string, string> = {
    traceparent: `00-${context.traceId}-${context.spanId}-${(context.traceFlags || 0x01).toString(16).padStart(2, '0')}`
  };
  
  if (context.traceState) {
    headers.tracestate = context.traceState;
  }
  
  return headers;
}

/**
 * Parses a traceparent header value into a trace context
 * @param traceparent The traceparent header value
 * @param tracestate Optional tracestate header value
 * @returns A trace context object
 */
export function parseTraceParentHeader(traceparent: string, tracestate?: string): TraceContext | null {
  const regex = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
  const match = traceparent.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    traceId: match[1],
    spanId: match[2],
    traceFlags: parseInt(match[3], 16),
    traceState: tracestate,
    isRemote: true
  };
}

/**
 * Creates a log context object with trace correlation information
 * @param context The trace context to include in logs
 * @returns An object that can be used as log metadata
 */
export function createLogContext(context: TraceContext): Record<string, unknown> {
  return {
    trace_id: context.traceId,
    span_id: context.spanId,
    trace_flags: (context.traceFlags || 0x01).toString(16).padStart(2, '0')
  };
}

/**
 * Verifies that a log entry contains the correct trace correlation information
 * @param logEntry The log entry to verify
 * @param expectedContext The expected trace context
 * @returns True if the log entry contains the correct trace context
 */
export function verifyLogTraceContext(
  logEntry: Record<string, unknown>,
  expectedContext: TraceContext
): boolean {
  return (
    logEntry.trace_id === expectedContext.traceId &&
    logEntry.span_id === expectedContext.spanId &&
    (!expectedContext.traceFlags || 
      logEntry.trace_flags === (expectedContext.traceFlags).toString(16).padStart(2, '0'))
  );
}

/**
 * Simulates an OpenTelemetry context object for testing
 * This is a simplified version for testing purposes
 */
export class MockOpenTelemetryContext {
  private readonly values: Map<symbol, unknown> = new Map();
  private static readonly SPAN_KEY = Symbol('span_key');
  
  /**
   * Sets a value in the context
   * @param key The key to set
   * @param value The value to set
   * @returns A new context with the value set
   */
  setValue(key: symbol, value: unknown): MockOpenTelemetryContext {
    const newContext = new MockOpenTelemetryContext();
    // Copy existing values
    this.values.forEach((v, k) => newContext.values.set(k, v));
    // Set new value
    newContext.values.set(key, value);
    return newContext;
  }
  
  /**
   * Gets a value from the context
   * @param key The key to get
   * @returns The value or undefined
   */
  getValue(key: symbol): unknown {
    return this.values.get(key);
  }
  
  /**
   * Sets the current span in the context
   * @param spanContext The span context to set
   * @returns A new context with the span set
   */
  setSpan(spanContext: TraceContext): MockOpenTelemetryContext {
    return this.setValue(MockOpenTelemetryContext.SPAN_KEY, spanContext);
  }
  
  /**
   * Gets the current span from the context
   * @returns The current span context or undefined
   */
  getSpan(): TraceContext | undefined {
    return this.getValue(MockOpenTelemetryContext.SPAN_KEY) as TraceContext | undefined;
  }
}