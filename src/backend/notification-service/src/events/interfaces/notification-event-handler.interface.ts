/**
 * @file notification-event-handler.interface.ts
 * @description Defines interfaces for notification event handlers, processors, and the overall processing pipeline.
 * This file establishes the contract that notification event handlers must implement, enabling consistent
 * handling of events from different sources with proper error recovery, retry logic, and observability.
 */

import { INotificationEvent } from './notification-event.interface';
import { INotificationEventResponse } from './notification-event-response.interface';
import { INotificationStatus } from './notification-status.interface';
import { IRetryableOperation } from '../../retry/interfaces/retryable-operation.interface';
import { IRetryPolicy } from '../../retry/interfaces/retry-policy.interface';

/**
 * Base interface for all notification event handlers.
 * Defines the contract that all notification handlers must implement to process events.
 * @template T - The specific notification event type this handler processes
 * @template R - The response type returned by this handler
 */
export interface INotificationEventHandler<
  T extends INotificationEvent = INotificationEvent,
  R extends INotificationEventResponse = INotificationEventResponse
> {
  /**
   * Processes a notification event and returns a response.
   * @param event - The notification event to process
   * @returns A promise resolving to a notification event response
   */
  handle(event: T): Promise<R>;

  /**
   * Determines if this handler can process the given event.
   * @param event - The notification event to check
   * @returns True if this handler can process the event, false otherwise
   */
  canHandle(event: T): boolean;

  /**
   * Gets the event type(s) this handler can process.
   * @returns An array of event types this handler supports
   */
  getSupportedEventTypes(): string[];

  /**
   * Gets the notification channel this handler is responsible for.
   * @returns The channel identifier (e.g., 'email', 'sms', 'push', 'in-app')
   */
  getChannel(): string;
}

/**
 * Interface for notification event handlers that support retry operations.
 * Extends the base handler interface with retry capabilities.
 * @template T - The specific notification event type this handler processes
 * @template R - The response type returned by this handler
 */
export interface IRetryableNotificationEventHandler<
  T extends INotificationEvent = INotificationEvent,
  R extends INotificationEventResponse = INotificationEventResponse
> extends INotificationEventHandler<T, R>, IRetryableOperation<T, R> {
  /**
   * Gets the retry policy to use for this handler.
   * @param event - The notification event being processed
   * @returns The retry policy to apply
   */
  getRetryPolicy(event: T): IRetryPolicy;

  /**
   * Determines if a failed operation should be retried based on the error.
   * @param event - The notification event that failed processing
   * @param error - The error that occurred during processing
   * @param attemptCount - The number of attempts made so far
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(event: T, error: Error, attemptCount: number): boolean;

  /**
   * Gets the maximum number of retry attempts for this handler.
   * @param event - The notification event being processed
   * @returns The maximum number of retry attempts
   */
  getMaxRetryAttempts(event: T): number;
}

/**
 * Interface for email notification event handlers.
 * Specializes the base handler interface for email-specific processing.
 */
export interface IEmailNotificationEventHandler extends IRetryableNotificationEventHandler {
  /**
   * Gets the email provider to use for sending the notification.
   * @param event - The notification event being processed
   * @returns The email provider identifier
   */
  getEmailProvider(event: INotificationEvent): string;

  /**
   * Validates email-specific notification payload.
   * @param event - The notification event to validate
   * @returns True if the payload is valid, false otherwise
   */
  validateEmailPayload(event: INotificationEvent): boolean;
}

/**
 * Interface for SMS notification event handlers.
 * Specializes the base handler interface for SMS-specific processing.
 */
export interface ISmsNotificationEventHandler extends IRetryableNotificationEventHandler {
  /**
   * Gets the SMS provider to use for sending the notification.
   * @param event - The notification event being processed
   * @returns The SMS provider identifier
   */
  getSmsProvider(event: INotificationEvent): string;

  /**
   * Validates SMS-specific notification payload.
   * @param event - The notification event to validate
   * @returns True if the payload is valid, false otherwise
   */
  validateSmsPayload(event: INotificationEvent): boolean;
}

/**
 * Interface for push notification event handlers.
 * Specializes the base handler interface for push notification-specific processing.
 */
export interface IPushNotificationEventHandler extends IRetryableNotificationEventHandler {
  /**
   * Gets the push notification provider to use for sending the notification.
   * @param event - The notification event being processed
   * @returns The push notification provider identifier
   */
  getPushProvider(event: INotificationEvent): string;

  /**
   * Validates push notification-specific payload.
   * @param event - The notification event to validate
   * @returns True if the payload is valid, false otherwise
   */
  validatePushPayload(event: INotificationEvent): boolean;
}

/**
 * Interface for in-app notification event handlers.
 * Specializes the base handler interface for in-app notification-specific processing.
 */
export interface IInAppNotificationEventHandler extends IRetryableNotificationEventHandler {
  /**
   * Gets the storage mechanism to use for the in-app notification.
   * @param event - The notification event being processed
   * @returns The storage mechanism identifier
   */
  getStorageMechanism(event: INotificationEvent): string;

  /**
   * Validates in-app notification-specific payload.
   * @param event - The notification event to validate
   * @returns True if the payload is valid, false otherwise
   */
  validateInAppPayload(event: INotificationEvent): boolean;
}

/**
 * Interface for the notification processor that orchestrates the event processing pipeline.
 * Responsible for routing events to appropriate handlers, managing retries, and tracking status.
 */
export interface INotificationProcessor {
  /**
   * Processes a notification event by routing it to the appropriate handler.
   * @param event - The notification event to process
   * @returns A promise resolving to a notification event response
   */
  process(event: INotificationEvent): Promise<INotificationEventResponse>;

  /**
   * Registers a notification event handler with the processor.
   * @param handler - The handler to register
   * @returns The processor instance for method chaining
   */
  registerHandler(handler: INotificationEventHandler): INotificationProcessor;

  /**
   * Gets all registered handlers for a specific event type.
   * @param eventType - The event type to get handlers for
   * @returns An array of handlers that can process the event type
   */
  getHandlersForEventType(eventType: string): INotificationEventHandler[];

  /**
   * Gets the status of a notification event.
   * @param eventId - The ID of the event to get status for
   * @returns A promise resolving to the notification status
   */
  getStatus(eventId: string): Promise<INotificationStatus>;

  /**
   * Attempts to retry a failed notification event.
   * @param eventId - The ID of the event to retry
   * @returns A promise resolving to the notification event response
   */
  retry(eventId: string): Promise<INotificationEventResponse>;

  /**
   * Handles fallback delivery when primary channel fails.
   * @param event - The original notification event that failed
   * @param response - The failed response from the primary channel
   * @returns A promise resolving to a notification event response from the fallback channel
   */
  handleFallback(event: INotificationEvent, response: INotificationEventResponse): Promise<INotificationEventResponse>;
}

/**
 * Interface for notification event handler factories.
 * Responsible for creating appropriate handlers based on event characteristics.
 */
export interface INotificationHandlerFactory {
  /**
   * Creates an appropriate handler for the given notification event.
   * @param event - The notification event to create a handler for
   * @returns The appropriate notification event handler
   */
  createHandler(event: INotificationEvent): INotificationEventHandler;

  /**
   * Registers a handler creator function for a specific event type.
   * @param eventType - The event type to register a creator for
   * @param creator - The function that creates a handler for the event type
   * @returns The factory instance for method chaining
   */
  registerHandlerCreator(
    eventType: string,
    creator: (event: INotificationEvent) => INotificationEventHandler
  ): INotificationHandlerFactory;
}

/**
 * Interface for notification delivery tracking.
 * Provides methods for tracking and updating the delivery status of notifications.
 */
export interface INotificationTracker {
  /**
   * Tracks the initial dispatch of a notification event.
   * @param event - The notification event being dispatched
   * @returns A promise resolving to the initial notification status
   */
  trackDispatch(event: INotificationEvent): Promise<INotificationStatus>;

  /**
   * Updates the status of a notification event.
   * @param eventId - The ID of the event to update
   * @param status - The new status information
   * @returns A promise resolving to the updated notification status
   */
  updateStatus(eventId: string, status: Partial<INotificationStatus>): Promise<INotificationStatus>;

  /**
   * Records a delivery attempt for a notification event.
   * @param eventId - The ID of the event
   * @param successful - Whether the attempt was successful
   * @param error - The error that occurred, if any
   * @returns A promise resolving to the updated notification status
   */
  recordAttempt(eventId: string, successful: boolean, error?: Error): Promise<INotificationStatus>;

  /**
   * Gets the current status of a notification event.
   * @param eventId - The ID of the event to get status for
   * @returns A promise resolving to the notification status
   */
  getStatus(eventId: string): Promise<INotificationStatus>;
}