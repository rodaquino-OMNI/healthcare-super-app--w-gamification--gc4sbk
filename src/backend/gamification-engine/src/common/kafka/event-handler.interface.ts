/**
 * @file event-handler.interface.ts
 * @description Defines the interface contract for Kafka event handlers in the gamification engine.
 * Specifies required methods for message validation, processing, and error handling,
 * ensuring that all event handlers follow consistent patterns and can be used
 * interchangeably with the base consumer.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized event schemas defined in @austa/interfaces package
 * - Implementation of type-safe event schema
 * - Consistent error handling across event handlers
 */

import { KafkaMessage } from 'kafkajs';
import { IEvent, GamificationEvent } from '../../events/interfaces/event.interface';
import { IEventResponse } from '../../events/interfaces/event-response.interface';
import { IEventType } from '../../events/interfaces/event-type.interface';

/**
 * Context object passed to event handlers with additional information
 * about the Kafka message and processing environment.
 *
 * @interface IEventHandlerContext
 * @template T Type of additional context data
 */
export interface IEventHandlerContext<T = Record<string, any>> {
  /**
   * Original Kafka message that triggered the event
   */
  originalMessage: KafkaMessage;

  /**
   * Topic from which the message was consumed
   */
  topic: string;

  /**
   * Partition from which the message was consumed
   */
  partition: number;

  /**
   * Current retry attempt number (1-based)
   * Will be undefined for the first attempt
   */
  retryAttempt?: number;

  /**
   * Timestamp when the message was received
   */
  receivedAt: Date;

  /**
   * Correlation ID for distributed tracing
   * Will be generated if not present in the message
   */
  correlationId: string;

  /**
   * Additional context data specific to the handler
   */
  data?: T;
}

/**
 * Interface for Kafka event handlers in the gamification engine.
 * Defines the contract for components that process Kafka messages
 * and convert them to gamification events.
 *
 * @interface IKafkaEventHandler
 * @template T Type of event this handler processes, extends IEvent
 * @template C Type of additional context data
 */
export interface IKafkaEventHandler<T extends IEvent = IEvent, C = Record<string, any>> {
  /**
   * Validates a Kafka message to ensure it can be processed by this handler.
   * Should check message format, schema version, and any other requirements.
   *
   * @param message The Kafka message to validate
   * @param context Additional context for validation
   * @returns True if the message is valid and can be processed by this handler
   */
  validateMessage(message: KafkaMessage, context: IEventHandlerContext<C>): boolean;

  /**
   * Parses a Kafka message into an event object.
   * Should handle deserialization, type conversion, and data normalization.
   *
   * @param message The Kafka message to parse
   * @param context Additional context for parsing
   * @returns The parsed event object
   * @throws Error if the message cannot be parsed
   */
  parseMessage(message: KafkaMessage, context: IEventHandlerContext<C>): T;

  /**
   * Processes an event and returns a response.
   * This is the main business logic method for the handler.
   *
   * @param event The event to process
   * @param context Additional context for processing
   * @returns A promise that resolves to the event response
   */
  processEvent(event: T, context: IEventHandlerContext<C>): Promise<IEventResponse>;

  /**
   * Handles errors that occur during message processing.
   * Should determine if the error is retriable and provide error details.
   *
   * @param error The error that occurred
   * @param message The original Kafka message
   * @param context Additional context for error handling
   * @returns A promise that resolves to an object indicating if the error is retriable
   */
  handleError(error: Error, message: KafkaMessage, context: IEventHandlerContext<C>): Promise<{
    retriable: boolean;
    reason: string;
    errorDetails: Record<string, any>;
  }>;

  /**
   * Called before processing an event.
   * Can be used for logging, metrics, or other pre-processing tasks.
   *
   * @param event The event about to be processed
   * @param context Additional context for pre-processing
   * @returns A promise that resolves when pre-processing is complete
   */
  beforeProcess?(event: T, context: IEventHandlerContext<C>): Promise<void>;

  /**
   * Called after successfully processing an event.
   * Can be used for logging, metrics, or other post-processing tasks.
   *
   * @param event The processed event
   * @param response The response from processing
   * @param context Additional context for post-processing
   * @returns A promise that resolves when post-processing is complete
   */
  afterProcess?(event: T, response: IEventResponse, context: IEventHandlerContext<C>): Promise<void>;

  /**
   * Gets the topics this handler subscribes to.
   * Used by the consumer to determine which handlers to register for which topics.
   *
   * @returns An array of topic names
   */
  getSubscribedTopics(): string[];

  /**
   * Gets the event types this handler can process.
   * Used for routing messages to the appropriate handler based on event type.
   *
   * @returns An array of event type identifiers
   */
  getSupportedEventTypes(): string[];

  /**
   * Checks if this handler can process a specific event type.
   * Used for dynamic handler selection based on event type.
   *
   * @param eventType The event type to check
   * @returns True if this handler can process the event type
   */
  canHandleEventType(eventType: string): boolean;
}

/**
 * Interface for journey-specific Kafka event handlers.
 * Extends the base handler interface with journey-specific functionality.
 *
 * @interface IJourneyKafkaEventHandler
 * @template T Type of journey event this handler processes
 * @template C Type of additional context data
 */
export interface IJourneyKafkaEventHandler<
  T extends GamificationEvent,
  C = Record<string, any>
> extends IKafkaEventHandler<T, C> {
  /**
   * The journey this handler is responsible for
   */
  readonly journey: 'health' | 'care' | 'plan';

  /**
   * Gets the event types supported by this journey handler
   * @returns An array of event types for this journey
   */
  getSupportedEventTypes(): string[];

  /**
   * Validates that an event belongs to the correct journey
   * @param event The event to validate
   * @returns True if the event belongs to this handler's journey
   */
  validateJourney(event: IEvent): boolean;
}

/**
 * Interface for Kafka event handler factories.
 * Used to create handlers for specific event types or topics.
 *
 * @interface IKafkaEventHandlerFactory
 */
export interface IKafkaEventHandlerFactory {
  /**
   * Creates a handler for a specific event type
   * @param eventType The event type to create a handler for
   * @returns A handler for the specified event type, or undefined if none available
   */
  createHandlerForEventType(eventType: string): IKafkaEventHandler | undefined;

  /**
   * Creates a handler for a specific topic
   * @param topic The topic to create a handler for
   * @returns A handler for the specified topic, or undefined if none available
   */
  createHandlerForTopic(topic: string): IKafkaEventHandler | undefined;

  /**
   * Gets all available handlers
   * @returns An array of all available handlers
   */
  getAllHandlers(): IKafkaEventHandler[];
}

/**
 * Type for a function that determines if a message should be retried
 * @param error The error that occurred
 * @param attempt The current retry attempt (1-based)
 * @param message The Kafka message
 * @returns True if the message should be retried
 */
export type RetryDecisionFunction = (
  error: Error,
  attempt: number,
  message: KafkaMessage
) => boolean;

/**
 * Options for configuring a Kafka event handler
 * @interface KafkaEventHandlerOptions
 * @template C Type of additional context data
 */
export interface KafkaEventHandlerOptions<C = Record<string, any>> {
  /**
   * Topics this handler subscribes to
   */
  topics: string[];

  /**
   * Event types this handler supports
   */
  eventTypes: string[];

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Function to determine if a message should be retried
   * @default Always retry up to maxRetries
   */
  shouldRetry?: RetryDecisionFunction;

  /**
   * Dead letter queue topic for failed messages
   * @default '{originalTopic}.dlq'
   */
  deadLetterQueueTopic?: string;

  /**
   * Additional context data
   */
  contextData?: C;

  /**
   * Logger instance
   */
  logger?: any;
}