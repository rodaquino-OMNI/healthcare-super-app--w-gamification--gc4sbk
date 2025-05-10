/**
 * @file event-handler.interface.ts
 * @description Defines the contract for event handlers and processors that consume events throughout the application.
 * This interface ensures type-safe event processing with proper error handling, tracing, and retry mechanisms.
 */

import { IBaseEvent } from './base-event.interface';
import { IEventResponse, createErrorResponse } from './event-response.interface';
import { ValidationResult } from './event-validation.interface';

/**
 * Interface for event handlers that process specific types of events.
 * Provides a standardized contract for event processing across all services.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export interface IEventHandler<T = any, R = any> {
  /**
   * Processes an event and returns a response.
   * This is the main method that implements the event handling logic.
   * 
   * @param event - The event to handle
   * @param options - Optional processing options
   * @returns A promise resolving to an event response
   */
  handle(event: IBaseEvent<T>, options?: EventHandlerOptions): Promise<IEventResponse<R>>;

  /**
   * Determines if this handler can process the given event.
   * Used for routing events to the appropriate handler.
   * 
   * @param event - The event to check
   * @returns True if this handler can process the event, false otherwise
   */
  canHandle(event: IBaseEvent<unknown>): boolean;

  /**
   * Gets the event type(s) this handler can process.
   * Used for registration and discovery of handlers.
   * 
   * @returns The event type or array of event types this handler can process
   */
  getEventType(): string | string[];
}

/**
 * Options for event handler processing
 */
export interface EventHandlerOptions {
  /**
   * Whether to validate the event before processing
   * @default true
   */
  validate?: boolean;

  /**
   * Context information for tracing and monitoring
   */
  context?: {
    /**
     * Correlation ID for tracing related events
     */
    correlationId?: string;

    /**
     * Trace ID for distributed tracing
     */
    traceId?: string;

    /**
     * User ID associated with the event
     */
    userId?: string;

    /**
     * Journey context (health, care, plan)
     */
    journey?: string;

    /**
     * Additional context properties
     */
    [key: string]: any;
  };

  /**
   * Retry-related options
   */
  retry?: {
    /**
     * Current retry attempt number
     * @default 0
     */
    attempt?: number;

    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxAttempts?: number;

    /**
     * Delay between retry attempts in milliseconds
     * @default 1000
     */
    delay?: number;

    /**
     * Backoff factor for exponential backoff
     * @default 2
     */
    backoffFactor?: number;

    /**
     * Whether to use exponential backoff for retries
     * @default true
     */
    useExponentialBackoff?: boolean;
  };

  /**
   * Timeout for event processing in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Additional options specific to the handler
   */
  [key: string]: any;
}

/**
 * Interface for event processors that manage multiple handlers.
 * Responsible for routing events to the appropriate handler and managing the processing lifecycle.
 */
export interface IEventProcessor {
  /**
   * Processes an event by routing it to the appropriate handler.
   * 
   * @param event - The event to process
   * @param options - Optional processing options
   * @returns A promise resolving to an event response
   */
  process<T = any, R = any>(event: IBaseEvent<T>, options?: EventProcessorOptions): Promise<IEventResponse<R>>;

  /**
   * Registers an event handler with this processor.
   * 
   * @param handler - The handler to register
   * @returns The processor instance for chaining
   */
  registerHandler<T = any, R = any>(handler: IEventHandler<T, R>): this;

  /**
   * Gets all registered handlers.
   * 
   * @returns Array of registered handlers
   */
  getHandlers<T = any, R = any>(): IEventHandler<T, R>[];

  /**
   * Finds a handler for the specified event.
   * 
   * @param event - The event to find a handler for
   * @returns The appropriate handler or undefined if none found
   */
  findHandler<T = any, R = any>(event: IBaseEvent<unknown>): IEventHandler<T, R> | undefined;
}

/**
 * Options for event processor processing
 * Extends EventHandlerOptions with processor-specific options
 */
export interface EventProcessorOptions extends EventHandlerOptions {
  /**
   * Whether to throw an error if no handler is found for an event
   * @default true
   */
  requireHandler?: boolean;

  /**
   * Whether to process events in parallel when multiple handlers match
   * @default false
   */
  parallelProcessing?: boolean;

  /**
   * Maximum number of events to process in parallel
   * @default 10
   */
  maxParallelEvents?: number;
}

/**
 * Interface for batch event handlers that process multiple events at once.
 * Useful for optimizing processing of related events.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export interface IBatchEventHandler<T = any, R = any> extends IEventHandler<T[], R[]> {
  /**
   * Maximum batch size this handler can process
   * 
   * @returns The maximum number of events to batch
   */
  getMaxBatchSize(): number;

  /**
   * Determines if events can be batched together
   * 
   * @param events - The events to check for batching compatibility
   * @returns True if the events can be batched, false otherwise
   */
  canBatchEvents(events: IBaseEvent<T>[]): boolean;
}

/**
 * Interface for event handlers that support validation.
 * 
 * @template T - The type of event payload this handler validates and processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export interface IValidatingEventHandler<T = any, R = any> extends IEventHandler<T, R> {
  /**
   * Validates an event before processing.
   * 
   * @param event - The event to validate
   * @returns A validation result indicating if the event is valid
   */
  validateEvent(event: IBaseEvent<unknown>): Promise<ValidationResult>;
}

/**
 * Interface for event handlers that support dead-letter queues.
 * Provides methods for handling failed events.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export interface IDLQEventHandler<T = any, R = any> extends IEventHandler<T, R> {
  /**
   * Handles a failed event by sending it to a dead-letter queue.
   * 
   * @param event - The failed event
   * @param error - The error that occurred during processing
   * @param options - Optional processing options
   * @returns A promise resolving when the event has been sent to the DLQ
   */
  handleFailedEvent(event: IBaseEvent<T>, error: Error, options?: EventHandlerOptions): Promise<void>;

  /**
   * Gets the dead-letter queue topic or destination for this handler.
   * 
   * @returns The DLQ destination
   */
  getDLQDestination(): string;
}

/**
 * Interface for event handlers that support retry mechanisms.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export interface IRetryableEventHandler<T = any, R = any> extends IEventHandler<T, R> {
  /**
   * Determines if an event should be retried after a failure.
   * 
   * @param event - The failed event
   * @param error - The error that occurred during processing
   * @param retryCount - The current retry count
   * @returns True if the event should be retried, false otherwise
   */
  shouldRetry(event: IBaseEvent<T>, error: Error, retryCount: number): boolean;

  /**
   * Calculates the delay before the next retry attempt.
   * 
   * @param retryCount - The current retry count
   * @param options - Optional retry options
   * @returns The delay in milliseconds before the next retry
   */
  calculateRetryDelay(retryCount: number, options?: EventHandlerOptions): number;

  /**
   * Gets the maximum number of retry attempts for this handler.
   * 
   * @returns The maximum number of retry attempts
   */
  getMaxRetryAttempts(): number;
}

/**
 * Abstract base class for event handlers that provides common functionality.
 * Implements the IEventHandler interface with default behavior.
 * 
 * @template T - The type of event payload this handler processes
 * @template R - The type of data returned in the response (defaults to any)
 */
export abstract class BaseEventHandler<T = any, R = any> implements IEventHandler<T, R> {
  /**
   * The event type(s) this handler can process.
   */
  protected readonly eventType: string | string[];

  /**
   * Creates a new BaseEventHandler instance.
   * 
   * @param eventType - The event type(s) this handler can process
   */
  constructor(eventType: string | string[]) {
    this.eventType = eventType;
  }

  /**
   * Abstract method that must be implemented by subclasses to handle events.
   * 
   * @param event - The event to handle
   * @param options - Optional processing options
   */
  abstract handle(event: IBaseEvent<T>, options?: EventHandlerOptions): Promise<IEventResponse<R>>;

  /**
   * Determines if this handler can process the given event.
   * Default implementation checks if the event type matches the handler's event type(s).
   * 
   * @param event - The event to check
   * @returns True if this handler can process the event, false otherwise
   */
  canHandle(event: IBaseEvent<unknown>): boolean {
    if (Array.isArray(this.eventType)) {
      return this.eventType.includes(event.type);
    }
    return event.type === this.eventType;
  }

  /**
   * Gets the event type(s) this handler can process.
   * 
   * @returns The event type or array of event types this handler can process
   */
  getEventType(): string | string[] {
    return this.eventType;
  }

  /**
   * Creates an error response for a failed event.
   * 
   * @param event - The event that failed processing
   * @param error - The error that occurred
   * @param options - Optional processing options
   * @returns An error response
   */
  protected createErrorResponseFromError(
    event: IBaseEvent<T>,
    error: Error,
    options?: EventHandlerOptions
  ): IEventResponse {
    const errorCode = (error as any).code || 'EVENT_PROCESSING_ERROR';
    const metadata = {
      eventId: event.eventId,
      eventType: event.type,
      timestamp: new Date().toISOString(),
      ...(options?.context || {}),
      error: {
        name: error.name,
        stack: error.stack
      }
    };

    return createErrorResponse(errorCode, error.message, undefined, metadata);
  }
}

/**
 * Creates a simple event handler for the specified event type.
 * 
 * @param eventType - The event type this handler will process
 * @param handlerFn - The function that implements the handling logic
 * @returns An event handler instance
 */
export function createEventHandler<T = any, R = any>(
  eventType: string | string[],
  handlerFn: (event: IBaseEvent<T>, options?: EventHandlerOptions) => Promise<IEventResponse<R>>
): IEventHandler<T, R> {
  return new class extends BaseEventHandler<T, R> {
    constructor() {
      super(eventType);
    }

    async handle(event: IBaseEvent<T>, options?: EventHandlerOptions): Promise<IEventResponse<R>> {
      return handlerFn(event, options);
    }
  }();
}