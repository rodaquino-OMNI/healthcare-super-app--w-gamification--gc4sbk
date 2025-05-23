/**
 * @file trace-context.interface.ts
 * @description Defines the TraceContext interface for managing and propagating trace context
 * across service boundaries. This interface enables correlation of traces through different
 * components of the application, supporting end-to-end observability.
 *
 * @module @austa/tracing/interfaces
 */

import { Context } from '@opentelemetry/api';
import { JourneyContext, JourneyType } from './journey-context.interface';
import { SpanAttributes } from './span-attributes.interface';

/**
 * Interface for managing trace context across service boundaries.
 * Provides methods for extracting, injecting, and propagating trace context
 * throughout the AUSTA SuperApp ecosystem.
 */
export interface TraceContext {
  /**
   * Extracts trace context from carrier object (e.g., HTTP headers, Kafka message headers)
   * @param carrier The carrier object containing the serialized context
   * @param format The format of the carrier (default: HTTP headers)
   * @returns OpenTelemetry Context object with the extracted context
   */
  extract<T extends object>(carrier: T, format?: PropagationFormat): Context;

  /**
   * Injects the current trace context into a carrier object for propagation
   * @param context The OpenTelemetry Context to inject
   * @param carrier The carrier object to inject the context into
   * @param format The format of the carrier (default: HTTP headers)
   */
  inject<T extends object>(context: Context, carrier: T, format?: PropagationFormat): void;

  /**
   * Gets the current active trace context
   * @returns The current OpenTelemetry Context
   */
  getCurrentContext(): Context;

  /**
   * Sets the current active trace context
   * @param context The OpenTelemetry Context to set as active
   * @returns A function that restores the previous context when called
   */
  setCurrentContext(context: Context): () => void;

  /**
   * Creates a new child context from the current context
   * @param attributes Optional attributes to add to the new context
   * @returns A new OpenTelemetry Context derived from the current one
   */
  createChildContext(attributes?: SpanAttributes): Context;

  /**
   * Extracts the trace ID from the given context
   * @param context The OpenTelemetry Context to extract from (defaults to current context)
   * @returns The trace ID as a string, or undefined if not available
   */
  getTraceId(context?: Context): string | undefined;

  /**
   * Extracts the span ID from the given context
   * @param context The OpenTelemetry Context to extract from (defaults to current context)
   * @returns The span ID as a string, or undefined if not available
   */
  getSpanId(context?: Context): string | undefined;

  /**
   * Adds journey context to the trace context for business context correlation
   * @param journeyContext The journey context to add
   * @param context The OpenTelemetry Context to add to (defaults to current context)
   * @returns A new OpenTelemetry Context with the journey context added
   */
  withJourneyContext(journeyContext: JourneyContext, context?: Context): Context;

  /**
   * Extracts journey context from the trace context
   * @param context The OpenTelemetry Context to extract from (defaults to current context)
   * @returns The journey context if available, or undefined
   */
  getJourneyContext(context?: Context): JourneyContext | undefined;

  /**
   * Extracts journey type from the trace context
   * @param context The OpenTelemetry Context to extract from (defaults to current context)
   * @returns The journey type if available, or undefined
   */
  getJourneyType(context?: Context): JourneyType | undefined;

  /**
   * Adds correlation ID to the trace context for connecting logs, traces, and metrics
   * @param correlationId The correlation ID to add
   * @param context The OpenTelemetry Context to add to (defaults to current context)
   * @returns A new OpenTelemetry Context with the correlation ID added
   */
  withCorrelationId(correlationId: string, context?: Context): Context;

  /**
   * Extracts correlation ID from the trace context
   * @param context The OpenTelemetry Context to extract from (defaults to current context)
   * @returns The correlation ID if available, or undefined
   */
  getCorrelationId(context?: Context): string | undefined;

  /**
   * Serializes the trace context to a string for storage or transmission
   * @param context The OpenTelemetry Context to serialize (defaults to current context)
   * @returns A string representation of the context
   */
  serializeContext(context?: Context): string;

  /**
   * Deserializes a string back into a trace context
   * @param serialized The serialized context string
   * @returns An OpenTelemetry Context object
   */
  deserializeContext(serialized: string): Context;

  /**
   * Creates a context for an external system integration
   * @param externalSystemName Name of the external system
   * @param attributes Additional attributes for the external system
   * @param context The OpenTelemetry Context to base on (defaults to current context)
   * @returns A new OpenTelemetry Context for the external system integration
   */
  createExternalSystemContext(
    externalSystemName: string,
    attributes?: SpanAttributes,
    context?: Context
  ): Context;

  /**
   * Merges two contexts, preserving trace information from both
   * @param primary The primary context that takes precedence
   * @param secondary The secondary context to merge
   * @returns A new merged OpenTelemetry Context
   */
  mergeContexts(primary: Context, secondary: Context): Context;

  /**
   * Clears all trace context, useful for testing or isolating operations
   * @returns A new empty OpenTelemetry Context
   */
  clearContext(): Context;
}

/**
 * Enum defining the supported propagation formats for trace context
 */
export enum PropagationFormat {
  HTTP_HEADERS = 'http_headers',
  TEXT_MAP = 'text_map',
  BINARY = 'binary',
  KAFKA_HEADERS = 'kafka_headers',
  GRPC_METADATA = 'grpc_metadata',
  AWS_XRAY = 'aws_xray',
  DATADOG = 'datadog',
  JAEGER = 'jaeger',
  ZIPKIN = 'zipkin',
  B3 = 'b3',
  B3_SINGLE = 'b3_single',
  W3C_TRACE_CONTEXT = 'w3c_trace_context'
}

/**
 * Interface for trace context carrier in HTTP headers format
 */
export interface HttpTraceContextCarrier {
  [key: string]: string;
  'traceparent'?: string;
  'tracestate'?: string;
  'x-correlation-id'?: string;
  'x-journey-id'?: string;
  'x-journey-type'?: string;
  'x-user-id'?: string;
  'x-session-id'?: string;
}

/**
 * Interface for trace context carrier in Kafka headers format
 */
export interface KafkaTraceContextCarrier {
  [key: string]: Buffer;
  'traceparent'?: Buffer;
  'tracestate'?: Buffer;
  'x-correlation-id'?: Buffer;
  'x-journey-id'?: Buffer;
  'x-journey-type'?: Buffer;
  'x-user-id'?: Buffer;
  'x-session-id'?: Buffer;
}

/**
 * Constants for trace context keys
 */
export const TRACE_CONTEXT_KEYS = {
  TRACE_PARENT: 'traceparent',
  TRACE_STATE: 'tracestate',
  CORRELATION_ID: 'x-correlation-id',
  JOURNEY_ID: 'x-journey-id',
  JOURNEY_TYPE: 'x-journey-type',
  USER_ID: 'x-user-id',
  SESSION_ID: 'x-session-id',
  SPAN_ID: 'x-span-id',
  TRACE_ID: 'x-trace-id',
  BAGGAGE: 'baggage'
};

/**
 * Constants for trace context attribute keys
 */
export const TRACE_CONTEXT_ATTRIBUTES = {
  CORRELATION_ID: 'correlation.id',
  JOURNEY_ID: 'journey.id',
  JOURNEY_TYPE: 'journey.type',
  USER_ID: 'user.id',
  SESSION_ID: 'user.session.id',
  EXTERNAL_SYSTEM: 'external.system.name',
  SERVICE_NAME: 'service.name',
  COMPONENT_NAME: 'component.name'
};