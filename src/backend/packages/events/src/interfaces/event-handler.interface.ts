/**
 * @file event-handler.interface.ts
 * @description Defines the contract for event handlers and processors that consume events throughout the application.
 * This interface ensures type-safe event processing with proper error handling, tracing, and retry mechanisms.
 * It standardizes how events are processed across different services, ensuring consistent behavior for
 * gamification processing, notification delivery, and other event-driven operations.
 */

import { IEventResponse } from './event-response.interface';
import { ValidationResult } from './event-validation.interface';

/**
 * Options for event handling operations
 */
export interface EventHandlerOptions {
  /**
   * Whether to skip validation before processing
   * Default: false
   */
  skipValidation?: boolean;

  /**
   * Correlation ID for distributed tracing
   */
  correlationId?: string;

  /**
   * Current retry attempt number (0 for first attempt)
   */
  retryCount?: number;

  /**
   * Maximum number of retry attempts allowed
   */
  maxRetries?: number;

  /**
   * Context-specific handler options
   */
  [key: string]: any;
}

/**
 * Context information passed to event handlers during processing
 */
export interface EventHandlerContext {
  /**
   * Correlation ID for distributed tracing
   */
  correlationId?: string;

  /**
   * ID of the service processing the event
   */
  serviceId?: string;

  /**
   * Current retry attempt number (0 for first attempt)
   */
  retryCount?: number;

  /**
   * Timestamp when the event processing started
   */
  startedAt?: string;

  /**
   * Journey context information if applicable
   */
  journeyContext?: {
    journeyType?: 'health' | 'care' | 'plan';
    userId?: string;
    sessionId?: string;
  };

  /**
   * Additional context-specific information
   */
  [key: string]: any;
}

/**
 * Interface for event handlers and processors that consume events throughout the application.
 * 
 * This interface ensures type-safe event processing with proper error handling, tracing, and retry mechanisms.
 * It standardizes how events are processed across different services, ensuring consistent behavior for
 * gamification processing, notification delivery, and other event-driven operations.
 * 
 * @template T Type of event payload this handler processes
 * @template R Type of data returned by the handler (defaults to any)
 */
export interface IEventHandler<T = any, R = any> {
  /**
   * Processes an event and returns a standardized response.
   * 
   * This is the main method that implements the event processing logic. It should:
   * 1. Validate the event payload if needed
   * 2. Process the event according to business rules
   * 3. Return a standardized response with success/failure status
   * 4. Handle errors appropriately and include error details in the response
   * 
   * @param event The event payload to process
   * @param context Additional context information for processing
   * @param options Options for controlling the handling behavior
   * @returns A promise resolving to a standardized event response
   */
  handle(event: T, context?: EventHandlerContext, options?: EventHandlerOptions): Promise<IEventResponse<R>>;

  /**
   * Determines whether this handler can process the given event.
   * 
   * This method allows for handler-specific validation logic to determine if an event
   * can be processed by this handler. It should check:
   * 1. If the event type matches what this handler can process
   * 2. If the event payload structure is valid for this handler
   * 3. If any business rules or preconditions are satisfied
   * 
   * @param event The event to check
   * @param context Additional context information
   * @returns A validation result indicating whether the handler can process the event
   */
  canHandle(event: any, context?: EventHandlerContext): Promise<ValidationResult>;

  /**
   * Returns the type of event this handler processes.
   * 
   * This method is used for routing events to the appropriate handler and for
   * diagnostic and monitoring purposes. It should return a string identifier
   * that uniquely identifies the event type this handler is responsible for.
   * 
   * @returns The event type string
   */
  getEventType(): string;

  /**
   * Returns the priority of this handler.
   * 
   * Used when multiple handlers can process the same event type.
   * Higher values indicate higher priority.
   * 
   * @returns The handler priority (default: 0)
   */
  getPriority?(): number;

  /**
   * Performs cleanup operations after event processing.
   * 
   * This method is called after event processing completes, regardless of success or failure.
   * It can be used to release resources, close connections, or perform other cleanup tasks.
   * 
   * @param event The event that was processed
   * @param response The response from the handle method
   * @param context The context that was used for processing
   */
  cleanup?(event: T, response: IEventResponse<R>, context?: EventHandlerContext): Promise<void>;
}

/**
 * Interface for event handlers that support batch processing of multiple events.
 * Extends the base IEventHandler interface with batch processing capabilities.
 * 
 * @template T Type of event payload this handler processes
 * @template R Type of data returned by the handler (defaults to any)
 */
export interface IBatchEventHandler<T = any, R = any> extends IEventHandler<T, R> {
  /**
   * Processes multiple events in a batch and returns an array of responses.
   * 
   * This method allows for efficient processing of multiple events at once,
   * which can improve performance for high-volume event processing scenarios.
   * 
   * @param events Array of event payloads to process
   * @param context Additional context information for processing
   * @param options Options for controlling the handling behavior
   * @returns A promise resolving to an array of standardized event responses
   */
  handleBatch(events: T[], context?: EventHandlerContext, options?: EventHandlerOptions): Promise<IEventResponse<R>[]>;

  /**
   * Returns the maximum batch size this handler can process efficiently.
   * 
   * This method helps event dispatchers determine how many events to send
   * to this handler at once for optimal performance.
   * 
   * @returns The maximum recommended batch size
   */
  getMaxBatchSize(): number;
}

/**
 * Interface for event handlers that support dead-letter queue (DLQ) processing.
 * Extends the base IEventHandler interface with DLQ-specific capabilities.
 * 
 * @template T Type of event payload this handler processes
 * @template R Type of data returned by the handler (defaults to any)
 */
export interface IDLQEventHandler<T = any, R = any> extends IEventHandler<T, R> {
  /**
   * Processes a failed event from the dead-letter queue.
   * 
   * This method implements special handling for events that have previously failed
   * processing and were sent to a dead-letter queue. It may implement different
   * logic than the standard handle method to address specific failure scenarios.
   * 
   * @param event The failed event payload to process
   * @param failureReason The reason the event was sent to the DLQ
   * @param failureCount Number of times this event has failed processing
   * @param context Additional context information for processing
   * @param options Options for controlling the handling behavior
   * @returns A promise resolving to a standardized event response
   */
  handleDeadLetter(
    event: T,
    failureReason: string,
    failureCount: number,
    context?: EventHandlerContext,
    options?: EventHandlerOptions
  ): Promise<IEventResponse<R>>;

  /**
   * Determines whether a failed event should be retried or permanently failed.
   * 
   * This method helps implement retry policies for failed events by determining
   * if an event should be retried based on the failure reason and count.
   * 
   * @param event The failed event
   * @param failureReason The reason the event failed
   * @param failureCount Number of times this event has failed
   * @returns True if the event should be retried, false otherwise
   */
  shouldRetryDeadLetter(event: T, failureReason: string, failureCount: number): Promise<boolean>;

  /**
   * Calculates the delay before retrying a failed event.
   * 
   * This method implements backoff strategies for retrying failed events,
   * such as exponential backoff or fixed interval with jitter.
   * 
   * @param failureCount Number of times this event has failed
   * @returns The delay in milliseconds before retrying
   */
  getRetryDelayMs(failureCount: number): number;
}