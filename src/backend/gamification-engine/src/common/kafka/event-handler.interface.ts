/**
 * @file event-handler.interface.ts
 * @description Defines the interface contract for Kafka event handlers in the gamification engine.
 * Specifies required methods for message validation, processing, and error handling,
 * ensuring that all event handlers follow consistent patterns and can be used
 * interchangeably with the base consumer.
 */

import { EventType } from '@austa/interfaces/gamification/events';
import { KafkaEvent, EventValidationResult } from '../kafka/kafka.types';

/**
 * Context object passed to event handlers for enhanced capabilities
 * Contains additional information and utilities for processing events
 */
export interface EventHandlerContext {
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** Source service or component that produced the event */
  source?: string;
  /** Additional metadata for the event */
  metadata?: Record<string, unknown>;
  /** Logger instance for structured logging */
  logger?: any; // Will be replaced with proper Logger type when available
  /** Tracer instance for distributed tracing */
  tracer?: any; // Will be replaced with proper Tracer type when available
}

/**
 * Result of event processing with detailed information
 */
export interface EventProcessingResult<T = unknown> {
  /** Whether the processing was successful */
  success: boolean;
  /** The processed event data (if successful) */
  data?: T;
  /** Error details (if unsuccessful) */
  error?: {
    /** Error message */
    message: string;
    /** Error code for programmatic handling */
    code?: string;
    /** Whether the error is retriable */
    retriable: boolean;
    /** Original error that caused this error */
    originalError?: Error;
  };
  /** Metadata about the processing */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for Kafka event handlers in the gamification engine
 * Defines the contract that all event handlers must implement
 * 
 * @template T - Type of the event payload
 * @template R - Type of the processing result
 */
export interface IEventHandler<T = unknown, R = unknown> {
  /**
   * Validates an event before processing
   * 
   * @param event - The event to validate
   * @param context - Additional context for validation
   * @returns Validation result with success flag and error details
   */
  validate(event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventValidationResult<KafkaEvent<T>>>;

  /**
   * Processes an event
   * 
   * @param event - The validated event to process
   * @param context - Additional context for processing
   * @returns Processing result with success flag and result data or error details
   */
  process(event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventProcessingResult<R>>;

  /**
   * Handles errors that occur during event processing
   * 
   * @param error - The error that occurred
   * @param event - The event that caused the error
   * @param context - Additional context for error handling
   * @returns Error handling result
   */
  handleError(error: Error, event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventProcessingResult>;

  /**
   * Performs pre-processing tasks before the main processing
   * 
   * @param event - The event to pre-process
   * @param context - Additional context for pre-processing
   * @returns Pre-processed event or null to skip processing
   */
  preProcess?(event: KafkaEvent<T>, context?: EventHandlerContext): Promise<KafkaEvent<T> | null>;

  /**
   * Performs post-processing tasks after the main processing
   * 
   * @param result - The result of the main processing
   * @param event - The original event
   * @param context - Additional context for post-processing
   * @returns Final processing result
   */
  postProcess?(result: EventProcessingResult<R>, event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventProcessingResult<R>>;

  /**
   * Checks if this handler can process the given event
   * 
   * @param event - The event to check
   * @returns Whether this handler can process the event
   */
  canHandle(event: KafkaEvent): boolean;

  /**
   * Gets the event types that this handler can process
   * 
   * @returns Array of supported event types
   */
  getEventTypes(): EventType[];

  /**
   * Gets the journey that this handler is responsible for
   * 
   * @returns The journey name (health, care, plan) or 'all' for cross-journey handlers
   */
  getJourney(): 'health' | 'care' | 'plan' | 'all';
}

/**
 * Abstract base class for event handlers that implements common functionality
 * Provides default implementations for some methods to reduce boilerplate
 * 
 * @template T - Type of the event payload
 * @template R - Type of the processing result
 */
export abstract class BaseEventHandler<T = unknown, R = unknown> implements IEventHandler<T, R> {
  /**
   * The event types that this handler can process
   */
  protected abstract readonly supportedEventTypes: EventType[];

  /**
   * The journey that this handler is responsible for
   */
  protected abstract readonly journey: 'health' | 'care' | 'plan' | 'all';

  /**
   * Validates an event before processing
   * Default implementation checks if the event type is supported
   * 
   * @param event - The event to validate
   * @param context - Additional context for validation
   * @returns Validation result with success flag and error details
   */
  async validate(event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventValidationResult<KafkaEvent<T>>> {
    // Check if the event type is supported by this handler
    if (!this.canHandle(event)) {
      return {
        success: false,
        error: {
          message: `Event type ${event.type} is not supported by this handler`,
          code: 'UNSUPPORTED_EVENT_TYPE',
        },
      };
    }

    // Basic event structure validation
    if (!event.eventId || !event.userId || !event.timestamp || !event.type) {
      return {
        success: false,
        error: {
          message: 'Event is missing required fields',
          code: 'INVALID_EVENT_FORMAT',
        },
      };
    }

    return { success: true, event };
  }

  /**
   * Abstract method that must be implemented by concrete handlers
   * Processes an event after validation
   * 
   * @param event - The validated event to process
   * @param context - Additional context for processing
   * @returns Processing result with success flag and result data or error details
   */
  abstract process(event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventProcessingResult<R>>;

  /**
   * Handles errors that occur during event processing
   * Default implementation logs the error and returns a failure result
   * 
   * @param error - The error that occurred
   * @param event - The event that caused the error
   * @param context - Additional context for error handling
   * @returns Error handling result
   */
  async handleError(error: Error, event: KafkaEvent<T>, context?: EventHandlerContext): Promise<EventProcessingResult> {
    // Log the error with context
    if (context?.logger) {
      context.logger.error(
        `Error processing event ${event.eventId} of type ${event.type}:`,
        {
          error: error.message,
          stack: error.stack,
          eventId: event.eventId,
          eventType: event.type,
          userId: event.userId,
          correlationId: context.correlationId,
        }
      );
    } else {
      console.error(
        `Error processing event ${event.eventId} of type ${event.type}:`,
        error
      );
    }

    // Determine if the error is retriable
    const retriable = this.isRetriableError(error);

    return {
      success: false,
      error: {
        message: error.message,
        code: (error as any).code || 'PROCESSING_ERROR',
        retriable,
        originalError: error,
      },
      metadata: {
        eventId: event.eventId,
        eventType: event.type,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Determines if an error is retriable
   * Override this method to customize retry behavior
   * 
   * @param error - The error to check
   * @returns Whether the error is retriable
   */
  protected isRetriableError(error: Error): boolean {
    // By default, consider these errors as retriable
    const retriableErrorTypes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'CONNECTION_ERROR',
      'RESOURCE_EXHAUSTED',
      'UNAVAILABLE',
      'INTERNAL_ERROR',
      'DATABASE_ERROR',
    ];

    // Check if the error has a code property that indicates it's retriable
    return retriableErrorTypes.includes((error as any).code);
  }

  /**
   * Checks if this handler can process the given event
   * Default implementation checks if the event type is in the supported types
   * and if the event journey matches the handler's journey
   * 
   * @param event - The event to check
   * @returns Whether this handler can process the event
   */
  canHandle(event: KafkaEvent): boolean {
    // Check if the event type is supported
    const isTypeSupported = this.supportedEventTypes.includes(event.type as EventType);
    
    // Check if the journey matches
    const isJourneyMatched = 
      this.journey === 'all' || 
      event.journey === this.journey;
    
    return isTypeSupported && isJourneyMatched;
  }

  /**
   * Gets the event types that this handler can process
   * 
   * @returns Array of supported event types
   */
  getEventTypes(): EventType[] {
    return [...this.supportedEventTypes];
  }

  /**
   * Gets the journey that this handler is responsible for
   * 
   * @returns The journey name (health, care, plan) or 'all' for cross-journey handlers
   */
  getJourney(): 'health' | 'care' | 'plan' | 'all' {
    return this.journey;
  }
}