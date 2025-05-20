import { Context, SpanContext } from '@opentelemetry/api';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { KafkaMessage } from 'kafkajs';

/**
 * Interface representing journey-specific context information
 */
export interface JourneyContextInfo {
  /** Type of journey (health, care, plan) */
  journeyType: 'health' | 'care' | 'plan';
  
  /** Unique identifier for the journey instance */
  journeyId: string;
  
  /** Optional user identifier associated with the journey */
  userId?: string;
  
  /** Optional session identifier associated with the journey */
  sessionId?: string;
  
  /** Optional request identifier for correlation */
  requestId?: string;
}

/**
 * Interface for managing and propagating trace context across service boundaries.
 * 
 * The TraceContext interface enables correlation of traces through different components
 * of the application, supporting end-to-end observability. It provides methods for
 * extracting and injecting context across service boundaries, as well as utilities
 * for context serialization and deserialization.
 */
export interface TraceContext {
  /**
   * Gets the underlying OpenTelemetry Context object
   * @returns The OpenTelemetry Context object
   */
  getContext(): Context;
  
  /**
   * Gets the current active span context
   * @returns The current SpanContext or undefined if no span is active
   */
  getSpanContext(): SpanContext | undefined;
  
  /**
   * Gets the trace ID from the current context
   * @returns The trace ID or undefined if no trace is active
   */
  getTraceId(): string | undefined;
  
  /**
   * Gets the span ID from the current context
   * @returns The span ID or undefined if no span is active
   */
  getSpanId(): string | undefined;
  
  /**
   * Gets the trace flags from the current context
   * @returns The trace flags or undefined if no trace is active
   */
  getTraceFlags(): number | undefined;
  
  /**
   * Checks if the current context is sampled (will be recorded)
   * @returns True if the context is sampled, false otherwise
   */
  isSampled(): boolean;
  
  /**
   * Extracts trace context from HTTP headers
   * @param headers HTTP headers containing trace context
   * @returns A new TraceContext instance with the extracted context
   */
  extractFromHttpHeaders(headers: IncomingHttpHeaders): TraceContext;
  
  /**
   * Injects the current trace context into HTTP headers
   * @param headers HTTP headers object to inject context into
   * @returns The headers with injected trace context
   */
  injectIntoHttpHeaders(headers: OutgoingHttpHeaders): OutgoingHttpHeaders;
  
  /**
   * Extracts trace context from Kafka message headers
   * @param message Kafka message containing trace context in headers
   * @returns A new TraceContext instance with the extracted context
   */
  extractFromKafkaMessage(message: KafkaMessage): TraceContext;
  
  /**
   * Injects the current trace context into Kafka message headers
   * @param message Kafka message to inject trace context into
   * @returns The message with injected trace context
   */
  injectIntoKafkaMessage(message: KafkaMessage): KafkaMessage;
  
  /**
   * Serializes the trace context to a string for storage or transmission
   * @returns Serialized context as a string
   */
  serialize(): string;
  
  /**
   * Creates a new TraceContext from a serialized string
   * @param serialized Serialized context string
   * @returns A new TraceContext instance with the deserialized context
   */
  deserialize(serialized: string): TraceContext;
  
  /**
   * Adds journey-specific context to the trace context
   * @param journeyContext Journey context information
   * @returns A new TraceContext instance with the added journey context
   */
  withJourneyContext(journeyContext: JourneyContextInfo): TraceContext;
  
  /**
   * Extracts journey context from the trace context
   * @returns Journey context information if available, undefined otherwise
   */
  getJourneyContext(): JourneyContextInfo | undefined;
  
  /**
   * Creates a new trace context for a health journey
   * @param journeyId Unique identifier for the health journey
   * @param userId Optional user identifier
   * @param sessionId Optional session identifier
   * @param requestId Optional request identifier
   * @returns A new TraceContext instance with health journey context
   */
  withHealthJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext;
  
  /**
   * Creates a new trace context for a care journey
   * @param journeyId Unique identifier for the care journey
   * @param userId Optional user identifier
   * @param sessionId Optional session identifier
   * @param requestId Optional request identifier
   * @returns A new TraceContext instance with care journey context
   */
  withCareJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext;
  
  /**
   * Creates a new trace context for a plan journey
   * @param journeyId Unique identifier for the plan journey
   * @param userId Optional user identifier
   * @param sessionId Optional session identifier
   * @param requestId Optional request identifier
   * @returns A new TraceContext instance with plan journey context
   */
  withPlanJourney(journeyId: string, userId?: string, sessionId?: string, requestId?: string): TraceContext;
  
  /**
   * Gets correlation information for connecting logs, traces, and metrics
   * @returns Object containing correlation IDs (trace ID, span ID, etc.)
   */
  getCorrelationInfo(): {
    traceId: string | undefined;
    spanId: string | undefined;
    traceFlags: number | undefined;
    isSampled: boolean;
    journeyType?: 'health' | 'care' | 'plan';
    journeyId?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
  };
  
  /**
   * Creates a log context object with trace information for structured logging
   * @param additionalContext Additional context to include in the log
   * @returns Object containing trace context for logging
   */
  createLogContext(additionalContext?: Record<string, any>): Record<string, any>;
  
  /**
   * Creates a new trace context with additional attributes
   * @param attributes Attributes to add to the trace context
   * @returns A new TraceContext instance with the added attributes
   */
  withAttributes(attributes: Record<string, any>): TraceContext;
  
  /**
   * Checks if the trace context contains a specific attribute
   * @param key Attribute key to check
   * @returns True if the attribute exists, false otherwise
   */
  hasAttribute(key: string): boolean;
  
  /**
   * Gets the value of a specific attribute from the trace context
   * @param key Attribute key to get
   * @returns The attribute value or undefined if not found
   */
  getAttribute(key: string): any;
}