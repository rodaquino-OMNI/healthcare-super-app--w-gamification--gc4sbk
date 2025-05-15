/**
 * TraceContext Interface
 *
 * Defines the interface for managing and propagating trace context across service boundaries.
 * This interface enables correlation of traces through different components of the application,
 * supporting end-to-end observability and business transaction tracking.
 *
 * The trace context follows the W3C Trace Context specification and OpenTelemetry standards
 * for context propagation, ensuring compatibility with various tracing systems.
 */

import { Context } from '@opentelemetry/api';
import { JourneyContext, GamificationContext } from './journey-context.interface';
import { SpanAttributes } from './span-attributes.interface';

/**
 * Represents the carrier object used for context propagation.
 * This is typically headers in HTTP requests or message properties in messaging systems.
 */
export interface ContextCarrier {
  [key: string]: string;
}

/**
 * Represents the serialized form of a trace context that can be transmitted
 * across service boundaries or stored for later use.
 */
export interface SerializedTraceContext {
  /** W3C traceparent header value */
  traceParent: string;
  /** W3C tracestate header value */
  traceState?: string;
  /** Serialized journey context */
  journeyContext?: string;
  /** Serialized gamification context */
  gamificationContext?: string;
  /** Additional correlation identifiers */
  correlationIds?: {
    /** Request identifier */
    requestId?: string;
    /** Session identifier */
    sessionId?: string;
    /** User identifier */
    userId?: string;
    /** Transaction identifier for business transactions */
    transactionId?: string;
  };
  /** Additional baggage items */
  baggage?: Record<string, string>;
}

/**
 * Options for creating a new trace context
 */
export interface CreateTraceContextOptions {
  /** Parent context to inherit from */
  parentContext?: Context;
  /** Journey context to associate with the trace */
  journeyContext?: JourneyContext;
  /** Gamification context to associate with the trace */
  gamificationContext?: GamificationContext;
  /** Additional correlation identifiers */
  correlationIds?: {
    requestId?: string;
    sessionId?: string;
    userId?: string;
    transactionId?: string;
  };
  /** Additional attributes to add to the trace */
  attributes?: SpanAttributes;
  /** Whether to start a new trace even if parent context exists */
  forceNewTrace?: boolean;
}

/**
 * Options for extracting trace context from a carrier
 */
export interface ExtractTraceContextOptions {
  /** Whether to ignore invalid context in the carrier */
  ignoreInvalid?: boolean;
  /** Whether to create a new context if extraction fails */
  createIfMissing?: boolean;
  /** Default journey context to use if not present in carrier */
  defaultJourneyContext?: JourneyContext;
  /** Default gamification context to use if not present in carrier */
  defaultGamificationContext?: GamificationContext;
}

/**
 * Options for injecting trace context into a carrier
 */
export interface InjectTraceContextOptions {
  /** Whether to include journey context in the carrier */
  includeJourneyContext?: boolean;
  /** Whether to include gamification context in the carrier */
  includeGamificationContext?: boolean;
  /** Whether to include baggage in the carrier */
  includeBaggage?: boolean;
  /** Additional headers to include in the carrier */
  additionalHeaders?: Record<string, string>;
}

/**
 * Interface for managing trace context across service boundaries
 */
export interface TraceContext {
  /**
   * Creates a new trace context
   * 
   * @param options Options for creating the trace context
   * @returns The created trace context
   */
  create(options?: CreateTraceContextOptions): Context;

  /**
   * Extracts trace context from a carrier (e.g., HTTP headers)
   * 
   * @param carrier The carrier containing the trace context
   * @param options Options for extracting the trace context
   * @returns The extracted trace context
   */
  extract(carrier: ContextCarrier, options?: ExtractTraceContextOptions): Context;

  /**
   * Injects trace context into a carrier (e.g., HTTP headers)
   * 
   * @param context The trace context to inject
   * @param carrier The carrier to inject the trace context into
   * @param options Options for injecting the trace context
   * @returns The carrier with the injected trace context
   */
  inject(context: Context, carrier: ContextCarrier, options?: InjectTraceContextOptions): ContextCarrier;

  /**
   * Serializes trace context for storage or transmission
   * 
   * @param context The trace context to serialize
   * @returns The serialized trace context
   */
  serialize(context: Context): SerializedTraceContext;

  /**
   * Deserializes trace context from a serialized form
   * 
   * @param serialized The serialized trace context
   * @returns The deserialized trace context
   */
  deserialize(serialized: SerializedTraceContext): Context;

  /**
   * Gets the current active trace context
   * 
   * @returns The current active trace context
   */
  getCurrentContext(): Context;

  /**
   * Gets the trace ID from a context
   * 
   * @param context The context to get the trace ID from
   * @returns The trace ID
   */
  getTraceId(context: Context): string;

  /**
   * Gets the span ID from a context
   * 
   * @param context The context to get the span ID from
   * @returns The span ID
   */
  getSpanId(context: Context): string;

  /**
   * Gets the journey context from a trace context
   * 
   * @param context The context to get the journey context from
   * @returns The journey context, or undefined if not present
   */
  getJourneyContext(context: Context): JourneyContext | undefined;

  /**
   * Gets the gamification context from a trace context
   * 
   * @param context The context to get the gamification context from
   * @returns The gamification context, or undefined if not present
   */
  getGamificationContext(context: Context): GamificationContext | undefined;

  /**
   * Sets the journey context in a trace context
   * 
   * @param context The context to set the journey context in
   * @param journeyContext The journey context to set
   * @returns The updated context
   */
  setJourneyContext(context: Context, journeyContext: JourneyContext): Context;

  /**
   * Sets the gamification context in a trace context
   * 
   * @param context The context to set the gamification context in
   * @param gamificationContext The gamification context to set
   * @returns The updated context
   */
  setGamificationContext(context: Context, gamificationContext: GamificationContext): Context;

  /**
   * Gets correlation IDs from a trace context
   * 
   * @param context The context to get correlation IDs from
   * @returns The correlation IDs, or undefined if not present
   */
  getCorrelationIds(context: Context): {
    requestId?: string;
    sessionId?: string;
    userId?: string;
    transactionId?: string;
  } | undefined;

  /**
   * Sets correlation IDs in a trace context
   * 
   * @param context The context to set correlation IDs in
   * @param correlationIds The correlation IDs to set
   * @returns The updated context
   */
  setCorrelationIds(context: Context, correlationIds: {
    requestId?: string;
    sessionId?: string;
    userId?: string;
    transactionId?: string;
  }): Context;

  /**
   * Merges two trace contexts, combining their attributes and contexts
   * 
   * @param target The target context to merge into
   * @param source The source context to merge from
   * @returns The merged context
   */
  merge(target: Context, source: Context): Context;

  /**
   * Clears the current active trace context
   */
  clearCurrentContext(): void;

  /**
   * Checks if a context is sampled (will be exported)
   * 
   * @param context The context to check
   * @returns True if the context is sampled, false otherwise
   */
  isSampled(context: Context): boolean;

  /**
   * Checks if a context is valid
   * 
   * @param context The context to check
   * @returns True if the context is valid, false otherwise
   */
  isValid(context: Context): boolean;

  /**
   * Creates a child context from a parent context
   * 
   * @param parentContext The parent context
   * @param name The name of the child context
   * @param attributes Additional attributes for the child context
   * @returns The child context
   */
  createChildContext(parentContext: Context, name: string, attributes?: SpanAttributes): Context;

  /**
   * Propagates trace context to an external system that may use a different tracing format
   * 
   * @param context The context to propagate
   * @param format The format to propagate the context in (e.g., 'b3', 'jaeger')
   * @param carrier The carrier to inject the context into
   * @returns The carrier with the propagated context
   */
  propagateToExternalSystem(context: Context, format: string, carrier: ContextCarrier): ContextCarrier;

  /**
   * Extracts trace context from an external system that may use a different tracing format
   * 
   * @param format The format to extract the context from (e.g., 'b3', 'jaeger')
   * @param carrier The carrier containing the context
   * @returns The extracted context
   */
  extractFromExternalSystem(format: string, carrier: ContextCarrier): Context;
}