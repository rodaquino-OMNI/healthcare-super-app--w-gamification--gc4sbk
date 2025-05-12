/**
 * @file event-handler.interface.ts
 * @description Defines the contract for event handlers and processors that consume events
 * throughout the application. This interface ensures type-safe event processing with proper
 * error handling, tracing, and retry mechanisms.
 */

import { IVersionedEvent } from './event-versioning.interface';
import { ValidationResult } from './event-validation.interface';
import { IEventResponse, EventResponseStatus } from './event-response.interface';

/**
 * Interface for event handlers that process events throughout the application.
 * Implementations of this interface provide the core business logic for handling
 * specific event types across different services and journeys.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export interface IEventHandler<T = unknown, R = any> {
  /**
   * Processes an event and returns a response indicating success or failure.
   * This is the main method that contains the business logic for handling the event.
   * 
   * @param event - The event to process
   * @param context - Optional context information for processing
   * @returns A promise resolving to an event response
   */
  handle(event: IVersionedEvent & { payload: T }, context?: EventHandlerContext): Promise<IEventResponse<R>>;
  
  /**
   * Determines if this handler can process the given event.
   * This method allows for runtime validation of whether an event should be processed
   * by this handler, beyond just checking the event type.
   * 
   * @param event - The event to check
   * @param context - Optional context information
   * @returns A promise resolving to true if the handler can process the event, false otherwise
   */
  canHandle(event: IVersionedEvent, context?: EventHandlerContext): Promise<boolean>;
  
  /**
   * Gets the event type(s) this handler can process.
   * This method is used for routing events to the appropriate handler.
   * 
   * @returns The event type string or array of event types this handler can process
   */
  getEventType(): string | string[];
}

/**
 * Context information for event processing.
 * Provides additional metadata and services that may be needed during event handling.
 */
export interface EventHandlerContext {
  /**
   * Correlation ID for tracing requests across services
   */
  correlationId?: string;
  
  /**
   * Journey context (health, care, plan) for journey-specific processing
   */
  journeyContext?: 'health' | 'care' | 'plan' | 'game';
  
  /**
   * User ID associated with the event, if applicable
   */
  userId?: string;
  
  /**
   * Tenant ID for multi-tenant environments
   */
  tenantId?: string;
  
  /**
   * Current retry count if this event is being retried
   */
  retryCount?: number;
  
  /**
   * Maximum number of retries allowed for this event
   */
  maxRetries?: number;
  
  /**
   * Timestamp when the event was originally published
   */
  publishedAt?: string;
  
  /**
   * Additional context properties
   */
  [key: string]: any;
}

/**
 * Interface for event processors that manage the lifecycle of event processing.
 * Event processors are responsible for receiving events, routing them to the appropriate
 * handlers, and managing retries and error handling.
 */
export interface IEventProcessor {
  /**
   * Processes an event by routing it to the appropriate handler.
   * 
   * @param event - The event to process
   * @param context - Optional context information
   * @returns A promise resolving to the event response
   */
  process(event: IVersionedEvent, context?: EventHandlerContext): Promise<IEventResponse>;
  
  /**
   * Registers an event handler with this processor.
   * 
   * @param handler - The event handler to register
   */
  registerHandler(handler: IEventHandler): void;
  
  /**
   * Gets all registered handlers for a specific event type.
   * 
   * @param eventType - The event type to get handlers for
   * @returns An array of handlers that can process the event type
   */
  getHandlersForEventType(eventType: string): IEventHandler[];
  
  /**
   * Validates an event before processing.
   * 
   * @param event - The event to validate
   * @returns A promise resolving to the validation result
   */
  validateEvent(event: IVersionedEvent): Promise<ValidationResult>;
}

/**
 * Interface for Kafka-specific event handlers that process events from Kafka topics.
 * Extends the base event handler interface with Kafka-specific functionality.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response
 */
export interface IKafkaEventHandler<T = unknown, R = any> extends IEventHandler<T, R> {
  /**
   * Gets the Kafka topic(s) this handler listens to.
   * 
   * @returns The Kafka topic string or array of topics
   */
  getTopic(): string | string[];
  
  /**
   * Gets the consumer group ID for this handler.
   * 
   * @returns The consumer group ID
   */
  getConsumerGroupId(): string;
  
  /**
   * Handles a dead-letter event that has failed processing multiple times.
   * 
   * @param event - The failed event
   * @param error - The error that caused the failure
   * @param context - Optional context information
   * @returns A promise resolving to an event response
   */
  handleDeadLetter(event: IVersionedEvent & { payload: T }, error: Error, context?: EventHandlerContext): Promise<IEventResponse>;
}

/**
 * Interface for batch event handlers that process multiple events at once.
 * Useful for optimizing processing of high-volume events.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response
 */
export interface IBatchEventHandler<T = unknown, R = any> extends IEventHandler<T, R> {
  /**
   * Processes a batch of events and returns responses for each.
   * 
   * @param events - The events to process
   * @param context - Optional context information
   * @returns A promise resolving to an array of event responses
   */
  handleBatch(events: Array<IVersionedEvent & { payload: T }>, context?: EventHandlerContext): Promise<IEventResponse<R>[]>;
  
  /**
   * Gets the maximum batch size this handler can process.
   * 
   * @returns The maximum batch size
   */
  getMaxBatchSize(): number;
}

/**
 * Interface for retry policies that determine how failed events should be retried.
 */
export interface IRetryPolicy {
  /**
   * Determines if an event should be retried based on the error and context.
   * 
   * @param error - The error that caused the failure
   * @param context - The event handler context
   * @returns True if the event should be retried, false otherwise
   */
  shouldRetry(error: Error, context: EventHandlerContext): boolean;
  
  /**
   * Calculates the delay before the next retry attempt.
   * 
   * @param retryCount - The current retry count
   * @param error - The error that caused the failure
   * @returns The delay in milliseconds before the next retry
   */
  getRetryDelay(retryCount: number, error: Error): number;
  
  /**
   * Gets the maximum number of retry attempts.
   * 
   * @returns The maximum number of retries
   */
  getMaxRetries(): number;
}

/**
 * Factory for creating common event handler responses.
 */
export const EventHandlerResponseFactory = {
  /**
   * Creates a success response.
   * 
   * @param eventId - The ID of the processed event
   * @param eventType - The type of the processed event
   * @param data - Optional data to include in the response
   * @param metadata - Optional additional metadata
   * @returns A success event response
   */
  success: <T>(eventId: string, eventType: string, data?: T, metadata?: Record<string, any>): IEventResponse<T> => ({
    success: true,
    status: EventResponseStatus.SUCCESS,
    eventId,
    eventType,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  }),
  
  /**
   * Creates a failure response.
   * 
   * @param eventId - The ID of the processed event
   * @param eventType - The type of the processed event
   * @param error - The error that caused the failure
   * @param metadata - Optional additional metadata
   * @returns A failure event response
   */
  failure: <T>(eventId: string, eventType: string, error: Error, metadata?: Record<string, any>): IEventResponse<T> => ({
    success: false,
    status: EventResponseStatus.FAILURE,
    eventId,
    eventType,
    error: {
      code: error.name || 'ERROR',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      retryable: false,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  }),
  
  /**
   * Creates a retry response.
   * 
   * @param eventId - The ID of the processed event
   * @param eventType - The type of the processed event
   * @param error - The error that caused the failure
   * @param retryCount - The current retry count
   * @param metadata - Optional additional metadata
   * @returns A retry event response
   */
  retry: <T>(eventId: string, eventType: string, error: Error, retryCount: number, metadata?: Record<string, any>): IEventResponse<T> => ({
    success: false,
    status: EventResponseStatus.RETRY,
    eventId,
    eventType,
    error: {
      code: error.name || 'ERROR',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      retryable: true,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      retryCount,
      ...metadata,
    },
  }),
};

/**
 * Abstract base class for event handlers that provides common functionality.
 * Concrete handlers can extend this class to reduce boilerplate code.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response
 */
export abstract class BaseEventHandler<T = unknown, R = any> implements IEventHandler<T, R> {
  /**
   * The event type(s) this handler can process.
   */
  protected abstract eventType: string | string[];
  
  /**
   * Processes an event and returns a response.
   * Concrete implementations must override this method.
   * 
   * @param event - The event to process
   * @param context - Optional context information
   * @returns A promise resolving to an event response
   */
  abstract handle(event: IVersionedEvent & { payload: T }, context?: EventHandlerContext): Promise<IEventResponse<R>>;
  
  /**
   * Determines if this handler can process the given event.
   * Default implementation checks if the event type matches.
   * 
   * @param event - The event to check
   * @param context - Optional context information
   * @returns A promise resolving to true if the handler can process the event, false otherwise
   */
  async canHandle(event: IVersionedEvent, context?: EventHandlerContext): Promise<boolean> {
    const eventTypes = Array.isArray(this.eventType) ? this.eventType : [this.eventType];
    return eventTypes.includes(event.type);
  }
  
  /**
   * Gets the event type(s) this handler can process.
   * 
   * @returns The event type string or array of event types
   */
  getEventType(): string | string[] {
    return this.eventType;
  }
}