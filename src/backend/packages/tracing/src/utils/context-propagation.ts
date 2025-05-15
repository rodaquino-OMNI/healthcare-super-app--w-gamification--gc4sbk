import { Context, TextMapGetter, TextMapPropagator, TextMapSetter, context, propagation, trace } from '@opentelemetry/api';
import { JourneyType } from '../../interfaces/journey-context.interface';

/**
 * Custom TextMapSetter for HTTP headers
 * Implements the TextMapSetter interface to set key-value pairs in HTTP headers
 */
class HttpHeaderSetter implements TextMapSetter {
  constructor(private readonly headers: Record<string, string>) {}

  set(key: string, value: string): void {
    this.headers[key] = value;
  }
}

/**
 * Custom TextMapGetter for HTTP headers
 * Implements the TextMapGetter interface to get values from HTTP headers
 */
class HttpHeaderGetter implements TextMapGetter {
  constructor(private readonly headers: Record<string, string>) {}

  get(key: string): string | undefined {
    return this.headers[key];
  }

  keys(): string[] {
    return Object.keys(this.headers);
  }
}

/**
 * Custom TextMapSetter for Kafka message headers
 * Implements the TextMapSetter interface to set key-value pairs in Kafka message headers
 */
class KafkaHeaderSetter implements TextMapSetter {
  constructor(private readonly headers: Record<string, Buffer>) {}

  set(key: string, value: string): void {
    this.headers[key] = Buffer.from(value);
  }
}

/**
 * Custom TextMapGetter for Kafka message headers
 * Implements the TextMapGetter interface to get values from Kafka message headers
 */
class KafkaHeaderGetter implements TextMapGetter {
  constructor(private readonly headers: Record<string, Buffer>) {}

  get(key: string): string | undefined {
    const value = this.headers[key];
    return value ? value.toString() : undefined;
  }

  keys(): string[] {
    return Object.keys(this.headers);
  }
}

/**
 * Injects the current trace context into HTTP headers
 * @param headers The HTTP headers object to inject the trace context into
 * @param journeyType Optional journey type to include in the context
 * @returns The headers object with injected trace context
 */
export function injectTraceContextIntoHttpHeaders(
  headers: Record<string, string>,
  journeyType?: JourneyType
): Record<string, string> {
  const currentContext = context.active();
  const setter = new HttpHeaderSetter(headers);
  
  // Get the global propagator
  const propagator = propagation.getTextMapPropagator();
  
  // Add journey-specific context if provided
  let contextToInject = currentContext;
  if (journeyType) {
    contextToInject = addJourneyContext(currentContext, journeyType);
  }
  
  // Inject the context into the headers
  propagator.inject(contextToInject, headers, setter);
  
  return headers;
}

/**
 * Extracts trace context from HTTP headers
 * @param headers The HTTP headers object to extract the trace context from
 * @returns The extracted context
 */
export function extractTraceContextFromHttpHeaders(
  headers: Record<string, string>
): Context {
  const getter = new HttpHeaderGetter(headers);
  
  // Get the global propagator
  const propagator = propagation.getTextMapPropagator();
  
  // Extract the context from the headers
  return propagator.extract(context.active(), headers, getter);
}

/**
 * Injects the current trace context into Kafka message headers
 * @param headers The Kafka message headers to inject the trace context into
 * @param journeyType Optional journey type to include in the context
 * @returns The headers object with injected trace context
 */
export function injectTraceContextIntoKafkaHeaders(
  headers: Record<string, Buffer>,
  journeyType?: JourneyType
): Record<string, Buffer> {
  const currentContext = context.active();
  const setter = new KafkaHeaderSetter(headers);
  
  // Get the global propagator
  const propagator = propagation.getTextMapPropagator();
  
  // Add journey-specific context if provided
  let contextToInject = currentContext;
  if (journeyType) {
    contextToInject = addJourneyContext(currentContext, journeyType);
  }
  
  // Inject the context into the headers
  propagator.inject(contextToInject, headers, setter);
  
  return headers;
}

/**
 * Extracts trace context from Kafka message headers
 * @param headers The Kafka message headers to extract the trace context from
 * @returns The extracted context
 */
export function extractTraceContextFromKafkaHeaders(
  headers: Record<string, Buffer>
): Context {
  const getter = new KafkaHeaderGetter(headers);
  
  // Get the global propagator
  const propagator = propagation.getTextMapPropagator();
  
  // Extract the context from the headers
  return propagator.extract(context.active(), headers, getter);
}

/**
 * Serializes the current trace context to a string
 * @param journeyType Optional journey type to include in the context
 * @returns Serialized trace context as a string
 */
export function serializeTraceContext(journeyType?: JourneyType): string {
  const currentContext = context.active();
  const headers: Record<string, string> = {};
  
  // Add journey-specific context if provided
  let contextToSerialize = currentContext;
  if (journeyType) {
    contextToSerialize = addJourneyContext(currentContext, journeyType);
  }
  
  // Inject the context into a temporary headers object
  injectTraceContextIntoHttpHeaders(headers, journeyType);
  
  // Serialize the headers object to a JSON string
  return JSON.stringify(headers);
}

/**
 * Deserializes a trace context string and returns a Context object
 * @param serializedContext The serialized trace context string
 * @returns The deserialized Context object
 */
export function deserializeTraceContext(serializedContext: string): Context {
  try {
    // Parse the serialized context string back to a headers object
    const headers = JSON.parse(serializedContext) as Record<string, string>;
    
    // Extract the context from the headers
    return extractTraceContextFromHttpHeaders(headers);
  } catch (error) {
    // If parsing fails, return the current active context
    console.error('Failed to deserialize trace context:', error);
    return context.active();
  }
}

/**
 * Creates a new context with the current span and adds journey-specific attributes
 * @param ctx The current context
 * @param journeyType The journey type to add to the context
 * @returns A new context with journey-specific attributes
 */
export function addJourneyContext(ctx: Context, journeyType: JourneyType): Context {
  const currentSpan = trace.getSpan(ctx);
  
  if (currentSpan) {
    // Add journey-specific attributes to the span
    currentSpan.setAttribute('journey.type', journeyType);
    
    // Add additional attributes based on journey type
    switch (journeyType) {
      case JourneyType.HEALTH:
        currentSpan.setAttribute('journey.domain', 'health');
        break;
      case JourneyType.CARE:
        currentSpan.setAttribute('journey.domain', 'care');
        break;
      case JourneyType.PLAN:
        currentSpan.setAttribute('journey.domain', 'plan');
        break;
      default:
        break;
    }
    
    // Return a new context with the updated span
    return trace.setSpan(ctx, currentSpan);
  }
  
  return ctx;
}

/**
 * Gets the current trace ID from the active context
 * @returns The current trace ID or undefined if not available
 */
export function getCurrentTraceId(): string | undefined {
  const currentSpan = trace.getSpan(context.active());
  return currentSpan?.spanContext().traceId;
}

/**
 * Gets the current span ID from the active context
 * @returns The current span ID or undefined if not available
 */
export function getCurrentSpanId(): string | undefined {
  const currentSpan = trace.getSpan(context.active());
  return currentSpan?.spanContext().spanId;
}

/**
 * Creates a correlation object containing trace and span IDs for use in logs and metrics
 * @returns An object with trace_id and span_id properties
 */
export function getTraceCorrelationInfo(): { trace_id?: string; span_id?: string } {
  const traceId = getCurrentTraceId();
  const spanId = getCurrentSpanId();
  
  return {
    trace_id: traceId,
    span_id: spanId,
  };
}