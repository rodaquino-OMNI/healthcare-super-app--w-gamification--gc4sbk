/**
 * @file correlation-id.ts
 * @description Manages correlation IDs across distributed systems to enable end-to-end tracing of event flows.
 * This utility provides functions to generate, extract, and propagate correlation IDs through event processing
 * pipelines, allowing related events to be linked across multiple services, topics, and processing stages.
 */

import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

// Import from internal packages
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IJourneyEvent } from '../interfaces/journey-events.interface';
import { IKafkaEvent } from '../interfaces/kafka-event.interface';

/**
 * Standard header names for correlation ID propagation
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const TRACE_ID_HEADER = 'x-trace-id';
export const SPAN_ID_HEADER = 'x-span-id';
export const PARENT_ID_HEADER = 'x-parent-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Metadata key for correlation ID in events
 */
export const EVENT_CORRELATION_ID_KEY = 'correlation_id';

/**
 * Logger instance for correlation ID utilities
 */
const logger = new Logger('CorrelationId');

/**
 * Generates a new correlation ID using UUID v4
 * 
 * @returns A new correlation ID string
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Validates if a string is a valid correlation ID
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
 * Gets the current correlation ID from the active trace context
 * 
 * @returns The current correlation ID or undefined if not found
 */
export function getCurrentCorrelationId(): string | undefined {
  try {
    const span = trace.getSpan(context.active());
    if (!span) return undefined;
    
    // Try to get correlation ID from span attributes
    const correlationId = span.attributes[CORRELATION_ID_HEADER] as string;
    if (correlationId) return correlationId;
    
    // If no correlation ID is found, use the trace ID as a fallback
    const spanContext = span.spanContext();
    return spanContext.traceId;
  } catch (error) {
    logger.debug(`Failed to get current correlation ID: ${(error as Error).message}`);
    return undefined;
  }
}

/**
 * Sets the correlation ID on the current active span
 * 
 * @param correlationId The correlation ID to set
 * @returns True if successful, false otherwise
 */
export function setCurrentCorrelationId(correlationId: string): boolean {
  try {
    if (!isValidCorrelationId(correlationId)) {
      logger.warn(`Invalid correlation ID format: ${correlationId}`);
      return false;
    }
    
    const span = trace.getSpan(context.active());
    if (!span) {
      logger.debug('No active span found to set correlation ID');
      return false;
    }
    
    span.setAttribute(CORRELATION_ID_HEADER, correlationId);
    return true;
  } catch (error) {
    logger.debug(`Failed to set correlation ID: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Extracts correlation ID from an event object
 * 
 * @param event The event object containing correlation ID
 * @returns The extracted correlation ID or undefined if not found
 */
export function extractCorrelationId<T extends Record<string, any>>(
  event: T
): string | undefined {
  try {
    // Check in metadata first (standard location)
    if (event?.metadata?.[EVENT_CORRELATION_ID_KEY]) {
      const correlationId = event.metadata[EVENT_CORRELATION_ID_KEY] as string;
      if (isValidCorrelationId(correlationId)) {
        return correlationId;
      }
    }
    
    // Check in headers for Kafka events
    if ('headers' in event && typeof event.headers === 'object' && event.headers) {
      const kafkaEvent = event as unknown as IKafkaEvent;
      if (kafkaEvent.headers[CORRELATION_ID_HEADER]) {
        const headerValue = kafkaEvent.headers[CORRELATION_ID_HEADER];
        const correlationId = typeof headerValue === 'string' 
          ? headerValue 
          : headerValue instanceof Buffer 
            ? headerValue.toString('utf8') 
            : undefined;
            
        if (correlationId && isValidCorrelationId(correlationId)) {
          return correlationId;
        }
      }
    }
    
    // Check in the event ID as a fallback
    if ('eventId' in event && typeof event.eventId === 'string') {
      const baseEvent = event as unknown as IBaseEvent;
      if (isValidCorrelationId(baseEvent.eventId)) {
        return baseEvent.eventId;
      }
    }
    
    return undefined;
  } catch (error) {
    logger.warn(`Failed to extract correlation ID from event: ${(error as Error).message}`);
    return undefined;
  }
}

/**
 * Adds correlation ID to an event object
 * 
 * @param event The event object to add correlation ID to
 * @param correlationId Optional correlation ID to use (generates a new one if not provided)
 * @returns The event with added correlation ID
 */
export function addCorrelationId<T extends Record<string, any>>(
  event: T,
  correlationId?: string
): T {
  try {
    // Use provided correlation ID, current context, or generate a new one
    const finalCorrelationId = correlationId || getCurrentCorrelationId() || generateCorrelationId();
    
    // Clone the event to avoid modifying the original
    const eventWithCorrelation = { ...event };
    
    // Add metadata if it doesn't exist
    if (!eventWithCorrelation.metadata) {
      eventWithCorrelation.metadata = {};
    }
    
    // Add correlation ID to metadata
    eventWithCorrelation.metadata[EVENT_CORRELATION_ID_KEY] = finalCorrelationId;
    
    // If it's a Kafka event, also add to headers
    if ('headers' in eventWithCorrelation && typeof eventWithCorrelation.headers === 'object') {
      const kafkaEvent = eventWithCorrelation as unknown as IKafkaEvent;
      kafkaEvent.headers = { ...kafkaEvent.headers };
      kafkaEvent.headers[CORRELATION_ID_HEADER] = finalCorrelationId;
    }
    
    return eventWithCorrelation;
  } catch (error) {
    logger.warn(`Failed to add correlation ID to event: ${(error as Error).message}`);
    return event; // Return original event if modification fails
  }
}

/**
 * Creates HTTP headers with correlation ID information
 * 
 * @param correlationId Optional correlation ID to use (uses current context or generates new if not provided)
 * @returns HTTP headers object with correlation ID
 */
export function createCorrelationHeaders(
  correlationId?: string
): Record<string, string> {
  try {
    // Use provided correlation ID, current context, or generate a new one
    const finalCorrelationId = correlationId || getCurrentCorrelationId() || generateCorrelationId();
    
    const headers: Record<string, string> = {
      [CORRELATION_ID_HEADER]: finalCorrelationId
    };
    
    // Add trace context headers if available
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      headers[TRACE_ID_HEADER] = spanContext.traceId;
      headers[SPAN_ID_HEADER] = spanContext.spanId;
    }
    
    return headers;
  } catch (error) {
    logger.warn(`Failed to create correlation headers: ${(error as Error).message}`);
    return { [CORRELATION_ID_HEADER]: generateCorrelationId() };
  }
}

/**
 * Extracts correlation ID from HTTP headers
 * 
 * @param headers HTTP headers object
 * @returns The extracted correlation ID or undefined if not found
 */
export function extractCorrelationIdFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  try {
    // Check for correlation ID header
    const correlationId = headers[CORRELATION_ID_HEADER] || 
                          headers[CORRELATION_ID_HEADER.toLowerCase()];
    
    if (correlationId) {
      const idValue = Array.isArray(correlationId) ? correlationId[0] : correlationId;
      if (idValue && isValidCorrelationId(idValue)) {
        return idValue;
      }
    }
    
    // Check for request ID as fallback
    const requestId = headers[REQUEST_ID_HEADER] || 
                      headers[REQUEST_ID_HEADER.toLowerCase()];
    
    if (requestId) {
      const idValue = Array.isArray(requestId) ? requestId[0] : requestId;
      if (idValue && isValidCorrelationId(idValue)) {
        return idValue;
      }
    }
    
    return undefined;
  } catch (error) {
    logger.warn(`Failed to extract correlation ID from headers: ${(error as Error).message}`);
    return undefined;
  }
}

/**
 * Creates Kafka message headers with correlation ID
 * 
 * @param correlationId Optional correlation ID to use (uses current context or generates new if not provided)
 * @returns Kafka headers object with correlation ID
 */
export function createKafkaCorrelationHeaders(
  correlationId?: string
): Record<string, Buffer> {
  try {
    // Use provided correlation ID, current context, or generate a new one
    const finalCorrelationId = correlationId || getCurrentCorrelationId() || generateCorrelationId();
    
    const headers: Record<string, Buffer> = {
      [CORRELATION_ID_HEADER]: Buffer.from(finalCorrelationId, 'utf8')
    };
    
    // Add trace context headers if available
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      headers[TRACE_ID_HEADER] = Buffer.from(spanContext.traceId, 'utf8');
      headers[SPAN_ID_HEADER] = Buffer.from(spanContext.spanId, 'utf8');
    }
    
    return headers;
  } catch (error) {
    logger.warn(`Failed to create Kafka correlation headers: ${(error as Error).message}`);
    return { [CORRELATION_ID_HEADER]: Buffer.from(generateCorrelationId(), 'utf8') };
  }
}

/**
 * Links related events by correlation ID in the current trace
 * 
 * @param sourceEvent Source event containing correlation ID
 * @param targetEvent Target event to link with the source
 * @returns The target event with correlation ID from source
 */
export function linkEvents<T extends Record<string, any>, U extends Record<string, any>>(
  sourceEvent: T,
  targetEvent: U
): U {
  try {
    // Extract correlation ID from source event
    const correlationId = extractCorrelationId(sourceEvent);
    if (!correlationId) {
      logger.debug('No correlation ID found in source event');
      return targetEvent;
    }
    
    // Add correlation ID to target event
    return addCorrelationId(targetEvent, correlationId);
  } catch (error) {
    logger.warn(`Failed to link events: ${(error as Error).message}`);
    return targetEvent;
  }
}

/**
 * Creates a correlation context for a new event chain
 * 
 * @param journey Optional journey identifier (health, care, plan)
 * @returns Correlation context object with new correlation ID
 */
export function createCorrelationContext(journey?: string): {
  correlationId: string;
  metadata: Record<string, any>;
} {
  const correlationId = generateCorrelationId();
  
  // Create metadata with correlation ID
  const metadata: Record<string, any> = {
    [EVENT_CORRELATION_ID_KEY]: correlationId
  };
  
  // Add journey information if provided
  if (journey) {
    metadata.journey = journey;
  }
  
  return {
    correlationId,
    metadata
  };
}

/**
 * Executes a function with correlation ID context
 * 
 * @param fn Function to execute with correlation context
 * @param correlationId Optional correlation ID to use (generates new if not provided)
 * @returns Result of the function execution
 */
export async function withCorrelation<T>(
  fn: (correlationId: string) => Promise<T>,
  correlationId?: string
): Promise<T> {
  // Use provided correlation ID or generate a new one
  const finalCorrelationId = correlationId || generateCorrelationId();
  
  // Get current span or create a new one
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    // Set correlation ID on current span
    currentSpan.setAttribute(CORRELATION_ID_HEADER, finalCorrelationId);
    
    try {
      // Execute function with correlation ID
      return await fn(finalCorrelationId);
    } catch (error) {
      // Record error on span
      currentSpan.recordException(error as Error);
      currentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });
      throw error;
    }
  } else {
    // No active span, just execute the function
    return fn(finalCorrelationId);
  }
}

/**
 * Creates a correlation chain for tracking related events
 * 
 * @param rootEvent Root event to start the correlation chain
 * @param journey Optional journey identifier
 * @returns Correlation chain object with methods to add events to the chain
 */
export function createCorrelationChain<T extends Record<string, any>>(
  rootEvent: T,
  journey?: string
): {
  correlationId: string;
  addEvent: <U extends Record<string, any>>(event: U) => U;
  getMetadata: () => Record<string, any>;
} {
  // Extract or generate correlation ID
  const correlationId = extractCorrelationId(rootEvent) || generateCorrelationId();
  
  // Create metadata with correlation ID
  const metadata: Record<string, any> = {
    [EVENT_CORRELATION_ID_KEY]: correlationId
  };
  
  // Add journey information if provided
  if (journey) {
    metadata.journey = journey;
  }
  
  // Add correlation ID to root event if not already present
  if (!extractCorrelationId(rootEvent)) {
    addCorrelationId(rootEvent, correlationId);
  }
  
  return {
    correlationId,
    
    // Method to add an event to the correlation chain
    addEvent: <U extends Record<string, any>>(event: U): U => {
      return addCorrelationId(event, correlationId);
    },
    
    // Method to get metadata for new events
    getMetadata: (): Record<string, any> => {
      return { ...metadata };
    }
  };
}

/**
 * Enriches an error with correlation ID information
 * 
 * @param error Error to enrich
 * @param correlationId Optional correlation ID to use (uses current context if not provided)
 * @returns Enriched error with correlation ID
 */
export function enrichErrorWithCorrelation(
  error: Error,
  correlationId?: string
): Error {
  try {
    // Use provided correlation ID or get from current context
    const finalCorrelationId = correlationId || getCurrentCorrelationId();
    if (!finalCorrelationId) return error;
    
    // Add correlation ID to error object
    const enrichedError = error as Error & { correlationId?: string };
    enrichedError.correlationId = finalCorrelationId;
    
    // Add to error message if not already present
    if (!error.message.includes('correlationId')) {
      enrichedError.message = `${error.message} [correlationId: ${finalCorrelationId}]`;
    }
    
    return enrichedError;
  } catch {
    // If enrichment fails, return original error
    return error;
  }
}

/**
 * Extracts journey information from an event with correlation context
 * 
 * @param event Event with correlation context
 * @returns Journey identifier or undefined if not found
 */
export function extractJourneyFromCorrelationContext<T extends Record<string, any>>(
  event: T
): string | undefined {
  try {
    // Check in metadata first
    if (event?.metadata?.journey) {
      return event.metadata.journey as string;
    }
    
    // Check if it's a journey event
    if ('journey' in event && typeof event.journey === 'string') {
      return (event as unknown as IJourneyEvent).journey;
    }
    
    return undefined;
  } catch (error) {
    logger.debug(`Failed to extract journey from correlation context: ${(error as Error).message}`);
    return undefined;
  }
}