/**
 * Correlation ID Utilities
 * 
 * Manages correlation IDs across distributed systems to enable end-to-end tracing of event flows.
 * This utility provides functions to generate, extract, and propagate correlation IDs through
 * event processing pipelines, allowing related events to be linked across multiple services,
 * topics, and processing stages.
 */

import { v4 as uuidv4 } from 'uuid';
import { context, Context, propagation, trace } from '@opentelemetry/api';
import { BaseEvent } from '../interfaces/base-event.interface';

/**
 * Standard header names for correlation ID transmission across different protocols
 */
export const CORRELATION_HEADERS = {
  /**
   * Standard HTTP header for correlation ID
   */
  HTTP: 'x-correlation-id',

  /**
   * Kafka message header for correlation ID
   */
  KAFKA: 'correlation-id',

  /**
   * AMQP message property for correlation ID
   */
  AMQP: 'correlation_id',

  /**
   * gRPC metadata key for correlation ID
   */
  GRPC: 'correlation-id',

  /**
   * WebSocket message property for correlation ID
   */
  WEBSOCKET: 'correlationId',

  /**
   * OpenTelemetry baggage item key for correlation ID
   */
  OTEL_BAGGAGE: 'correlation.id'
};

/**
 * Symbol used to store correlation ID in the async context
 */
export const CORRELATION_ID_CONTEXT_KEY = Symbol.for('austa.correlation-id');

/**
 * Generates a new correlation ID using UUID v4
 * 
 * @returns A new correlation ID as a string
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Validates if a string is a valid correlation ID (UUID v4 format)
 * 
 * @param id The string to validate
 * @returns True if the string is a valid correlation ID, false otherwise
 */
export function isValidCorrelationId(id: string): boolean {
  if (!id) return false;
  
  // UUID v4 regex pattern
  const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Pattern.test(id);
}

/**
 * Gets the current correlation ID from the context, or generates a new one if none exists
 * 
 * @param generateIfMissing Whether to generate a new correlation ID if none exists in the context
 * @returns The current correlation ID, or undefined if none exists and generateIfMissing is false
 */
export function getCurrentCorrelationId(generateIfMissing = true): string | undefined {
  const currentContext = context.active();
  const correlationId = currentContext.getValue(CORRELATION_ID_CONTEXT_KEY) as string | undefined;
  
  if (!correlationId && generateIfMissing) {
    return generateCorrelationId();
  }
  
  return correlationId;
}

/**
 * Sets the correlation ID in the current context
 * 
 * @param correlationId The correlation ID to set
 * @returns A new context with the correlation ID set
 */
export function setCorrelationId(correlationId: string): Context {
  const currentContext = context.active();
  return currentContext.setValue(CORRELATION_ID_CONTEXT_KEY, correlationId);
}

/**
 * Runs a function with a specific correlation ID in context
 * 
 * @param correlationId The correlation ID to use
 * @param fn The function to run
 * @returns The result of the function
 */
export function withCorrelationId<T>(correlationId: string, fn: () => T): T {
  const newContext = setCorrelationId(correlationId);
  return context.with(newContext, fn);
}

/**
 * Extracts a correlation ID from HTTP headers
 * 
 * @param headers HTTP headers object
 * @param headerName Optional custom header name to use
 * @returns The extracted correlation ID, or undefined if none exists
 */
export function extractCorrelationIdFromHttpHeaders(
  headers: Record<string, string | string[] | undefined>,
  headerName = CORRELATION_HEADERS.HTTP
): string | undefined {
  const normalizedHeaderName = headerName.toLowerCase();
  
  // Handle case-insensitive headers
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedHeaderName) {
      if (Array.isArray(value)) {
        return value[0];
      }
      return value as string;
    }
  }
  
  return undefined;
}

/**
 * Extracts a correlation ID from Kafka message headers
 * 
 * @param headers Kafka message headers
 * @param headerName Optional custom header name to use
 * @returns The extracted correlation ID, or undefined if none exists
 */
export function extractCorrelationIdFromKafkaHeaders(
  headers: Array<{ key: string; value: Buffer | string | null }>,
  headerName = CORRELATION_HEADERS.KAFKA
): string | undefined {
  const header = headers.find(h => h.key === headerName);
  
  if (!header || header.value === null) {
    return undefined;
  }
  
  if (Buffer.isBuffer(header.value)) {
    return header.value.toString('utf8');
  }
  
  return header.value;
}

/**
 * Extracts a correlation ID from an event object
 * 
 * @param event The event object
 * @returns The extracted correlation ID, or undefined if none exists
 */
export function extractCorrelationIdFromEvent(event: BaseEvent): string | undefined {
  if (!event) return undefined;
  
  // Check in metadata first
  if (event.metadata?.correlationId) {
    return event.metadata.correlationId;
  }
  
  // Check in event data as fallback
  if (event.data && typeof event.data === 'object' && 'correlationId' in event.data) {
    return (event.data as Record<string, unknown>).correlationId as string;
  }
  
  return undefined;
}

/**
 * Adds a correlation ID to an event object
 * 
 * @param event The event object to add the correlation ID to
 * @param correlationId Optional correlation ID to use, if not provided the current context's correlation ID will be used
 * @returns A new event object with the correlation ID added
 */
export function addCorrelationIdToEvent<T extends BaseEvent>(event: T, correlationId?: string): T {
  const idToUse = correlationId || getCurrentCorrelationId();
  
  if (!idToUse) {
    return event;
  }
  
  // Create a copy of the event to avoid mutating the original
  const eventCopy = { ...event };
  
  // Initialize metadata if it doesn't exist
  if (!eventCopy.metadata) {
    eventCopy.metadata = {};
  }
  
  // Add correlation ID to metadata
  eventCopy.metadata.correlationId = idToUse;
  
  return eventCopy;
}

/**
 * Adds a correlation ID to HTTP headers
 * 
 * @param headers HTTP headers object to add the correlation ID to
 * @param correlationId Optional correlation ID to use, if not provided the current context's correlation ID will be used
 * @param headerName Optional custom header name to use
 * @returns The headers object with the correlation ID added
 */
export function addCorrelationIdToHttpHeaders(
  headers: Record<string, string | string[] | undefined>,
  correlationId?: string,
  headerName = CORRELATION_HEADERS.HTTP
): Record<string, string | string[] | undefined> {
  const idToUse = correlationId || getCurrentCorrelationId();
  
  if (!idToUse) {
    return headers;
  }
  
  // Create a copy of the headers to avoid mutating the original
  const headersCopy = { ...headers };
  
  // Add correlation ID to headers
  headersCopy[headerName] = idToUse;
  
  return headersCopy;
}

/**
 * Adds a correlation ID to Kafka message headers
 * 
 * @param headers Kafka message headers to add the correlation ID to
 * @param correlationId Optional correlation ID to use, if not provided the current context's correlation ID will be used
 * @param headerName Optional custom header name to use
 * @returns The headers array with the correlation ID added
 */
export function addCorrelationIdToKafkaHeaders(
  headers: Array<{ key: string; value: Buffer | string | null }>,
  correlationId?: string,
  headerName = CORRELATION_HEADERS.KAFKA
): Array<{ key: string; value: Buffer | string | null }> {
  const idToUse = correlationId || getCurrentCorrelationId();
  
  if (!idToUse) {
    return headers;
  }
  
  // Create a copy of the headers to avoid mutating the original
  const headersCopy = [...headers];
  
  // Remove existing correlation ID header if it exists
  const existingIndex = headersCopy.findIndex(h => h.key === headerName);
  if (existingIndex !== -1) {
    headersCopy.splice(existingIndex, 1);
  }
  
  // Add correlation ID to headers
  headersCopy.push({
    key: headerName,
    value: idToUse
  });
  
  return headersCopy;
}

/**
 * Integrates correlation ID with OpenTelemetry trace context
 * 
 * @param correlationId Optional correlation ID to use, if not provided the current context's correlation ID will be used
 * @returns The current span with the correlation ID added as an attribute
 */
export function addCorrelationIdToCurrentSpan(correlationId?: string): void {
  const idToUse = correlationId || getCurrentCorrelationId();
  
  if (!idToUse) {
    return;
  }
  
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.setAttribute('correlation.id', idToUse);
  }
}

/**
 * Extracts a correlation ID from OpenTelemetry trace context
 * 
 * @returns The correlation ID from the current span, or undefined if none exists
 */
export function extractCorrelationIdFromTraceContext(): string | undefined {
  const currentSpan = trace.getSpan(context.active());
  
  if (!currentSpan) {
    return undefined;
  }
  
  // Try to get the correlation ID from the span attributes
  const spanContext = currentSpan.spanContext();
  
  // If no explicit correlation ID is set, use the trace ID as a fallback
  return spanContext.traceId;
}

/**
 * Creates a correlation context propagator for use with OpenTelemetry
 * 
 * This propagator ensures that correlation IDs are properly propagated across service boundaries
 * using the OpenTelemetry context propagation mechanism.
 */
export const correlationContextPropagator = {
  inject(context: Context, carrier: Record<string, string>, setter: (carrier: Record<string, string>, key: string, value: string) => void): void {
    const correlationId = context.getValue(CORRELATION_ID_CONTEXT_KEY) as string | undefined;
    
    if (correlationId) {
      setter(carrier, CORRELATION_HEADERS.HTTP, correlationId);
    }
  },
  
  extract(context: Context, carrier: Record<string, string>, getter: (carrier: Record<string, string>, key: string) => string | undefined): Context {
    const correlationId = getter(carrier, CORRELATION_HEADERS.HTTP);
    
    if (correlationId && isValidCorrelationId(correlationId)) {
      return context.setValue(CORRELATION_ID_CONTEXT_KEY, correlationId);
    }
    
    return context;
  },
  
  fields(): string[] {
    return [CORRELATION_HEADERS.HTTP];
  }
};

/**
 * Registers the correlation context propagator with OpenTelemetry
 */
export function registerCorrelationContextPropagator(): void {
  const currentPropagators = propagation.getGlobalPropagator();
  
  // Create a composite propagator that includes the correlation context propagator
  const compositePropagator = {
    inject(context: Context, carrier: unknown, setter: any): void {
      currentPropagators.inject(context, carrier, setter);
      if (typeof carrier === 'object' && carrier !== null) {
        correlationContextPropagator.inject(
          context,
          carrier as Record<string, string>,
          setter
        );
      }
    },
    
    extract(context: Context, carrier: unknown, getter: any): Context {
      let updatedContext = currentPropagators.extract(context, carrier, getter);
      if (typeof carrier === 'object' && carrier !== null) {
        updatedContext = correlationContextPropagator.extract(
          updatedContext,
          carrier as Record<string, string>,
          getter
        );
      }
      return updatedContext;
    },
    
    fields(): string[] {
      return [...currentPropagators.fields(), ...correlationContextPropagator.fields()];
    }
  };
  
  // Set the composite propagator as the global propagator
  propagation.setGlobalPropagator(compositePropagator as any);
}

/**
 * Creates a middleware function for Express.js that extracts and sets the correlation ID from HTTP headers
 * 
 * @param options Configuration options
 * @returns Express middleware function
 */
export function createCorrelationIdMiddleware(options: {
  headerName?: string;
  generateIfMissing?: boolean;
} = {}) {
  const { headerName = CORRELATION_HEADERS.HTTP, generateIfMissing = true } = options;
  
  return (req: any, res: any, next: () => void) => {
    let correlationId = extractCorrelationIdFromHttpHeaders(req.headers, headerName);
    
    if (!correlationId && generateIfMissing) {
      correlationId = generateCorrelationId();
    }
    
    if (correlationId) {
      // Set correlation ID in response headers
      res.setHeader(headerName, correlationId);
      
      // Set correlation ID in context
      const newContext = setCorrelationId(correlationId);
      
      // Add correlation ID to current span if one exists
      addCorrelationIdToCurrentSpan(correlationId);
      
      // Run the next middleware with the new context
      context.with(newContext, next);
    } else {
      next();
    }
  };
}

/**
 * Creates a retry function with exponential backoff that preserves correlation ID context
 * 
 * @param operation The operation to retry
 * @param options Retry options
 * @returns A promise that resolves with the result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    retryableErrors?: Array<string | RegExp>;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    backoffFactor = 2,
    retryableErrors = []
  } = options;
  
  // Capture the current correlation ID
  const correlationId = getCurrentCorrelationId(false);
  
  let lastError: Error;
  let delay = initialDelayMs;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If we have a correlation ID, run the operation with it
      if (correlationId) {
        return await withCorrelationId(correlationId, async () => operation());
      }
      
      // Otherwise, just run the operation
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we've reached the maximum number of retries
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Check if the error is retryable
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = retryableErrors.length === 0 || retryableErrors.some(pattern => {
        if (typeof pattern === 'string') {
          return errorMessage.includes(pattern);
        }
        return pattern.test(errorMessage);
      });
      
      if (!isRetryable) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase the delay for the next retry (with a maximum limit)
      delay = Math.min(delay * backoffFactor, maxDelayMs);
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript requires it
  throw lastError!;
}