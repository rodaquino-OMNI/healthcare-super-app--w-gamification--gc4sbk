import { INotificationEvent } from './notification-event.interface';
import { INotificationEventResponse } from './notification-event-response.interface';
import { INotificationStatus } from './notification-status.interface';
import { IRetryableOperation } from '../../retry/interfaces/retryable-operation.interface';
import { IRetryOptions } from '../../retry/interfaces/retry-options.interface';
import { Observable } from 'rxjs';

/**
 * Base interface for all notification event handlers.
 * Defines the contract that all notification handlers must implement
 * to process events consistently across the notification service.
 */
export interface INotificationEventHandler<T extends INotificationEvent = INotificationEvent> {
  /**
   * Processes a notification event and returns a response indicating success or failure.
   * @param event The notification event to process
   * @returns A promise resolving to a notification event response
   */
  handle(event: T): Promise<INotificationEventResponse>;

  /**
   * Determines if this handler can process the given event.
   * @param event The notification event to check
   * @returns True if this handler can process the event, false otherwise
   */
  canHandle(event: T): boolean;

  /**
   * Gets the event types that this handler can process.
   * @returns Array of event type strings that this handler supports
   */
  getSupportedEventTypes(): string[];

  /**
   * Gets the retry options for this handler.
   * @returns The retry options configuration for this handler
   */
  getRetryOptions(): IRetryOptions;

  /**
   * Updates the status of a notification event.
   * @param eventId The ID of the event to update
   * @param status The new status to set
   * @returns A promise resolving to the updated notification status
   */
  updateStatus(eventId: string, status: Partial<INotificationStatus>): Promise<INotificationStatus>;
}

/**
 * Interface for email notification event handlers.
 * Extends the base notification event handler with email-specific functionality.
 */
export interface IEmailNotificationEventHandler extends INotificationEventHandler {
  /**
   * Sends an email notification.
   * @param to Recipient email address
   * @param subject Email subject
   * @param body Email body (HTML)
   * @param options Additional email options
   * @returns A promise resolving to a notification event response
   */
  sendEmail(to: string, subject: string, body: string, options?: any): Promise<INotificationEventResponse>;
}

/**
 * Interface for SMS notification event handlers.
 * Extends the base notification event handler with SMS-specific functionality.
 */
export interface ISmsNotificationEventHandler extends INotificationEventHandler {
  /**
   * Sends an SMS notification.
   * @param to Recipient phone number
   * @param message SMS message content
   * @param options Additional SMS options
   * @returns A promise resolving to a notification event response
   */
  sendSms(to: string, message: string, options?: any): Promise<INotificationEventResponse>;
}

/**
 * Interface for push notification event handlers.
 * Extends the base notification event handler with push-specific functionality.
 */
export interface IPushNotificationEventHandler extends INotificationEventHandler {
  /**
   * Sends a push notification.
   * @param token Device token to send to
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data payload
   * @returns A promise resolving to a notification event response
   */
  sendPush(token: string, title: string, body: string, data?: Record<string, any>): Promise<INotificationEventResponse>;
}

/**
 * Interface for in-app notification event handlers.
 * Extends the base notification event handler with in-app specific functionality.
 */
export interface IInAppNotificationEventHandler extends INotificationEventHandler {
  /**
   * Sends an in-app notification.
   * @param userId User ID to send to
   * @param notification Notification content
   * @returns A promise resolving to a notification event response
   */
  sendInApp(userId: string, notification: Record<string, any>): Promise<INotificationEventResponse>;
}

/**
 * Interface for notification event processors that orchestrate the processing pipeline.
 * Responsible for routing events to appropriate handlers and managing the processing lifecycle.
 */
export interface INotificationProcessor {
  /**
   * Processes a notification event through the appropriate handler.
   * @param event The notification event to process
   * @returns A promise resolving to a notification event response
   */
  process(event: INotificationEvent): Promise<INotificationEventResponse>;

  /**
   * Registers a notification event handler with the processor.
   * @param handler The handler to register
   * @returns The processor instance for chaining
   */
  registerHandler(handler: INotificationEventHandler): INotificationProcessor;

  /**
   * Gets a handler for the specified event.
   * @param event The event to get a handler for
   * @returns The appropriate handler for the event or undefined if none found
   */
  getHandlerForEvent(event: INotificationEvent): INotificationEventHandler | undefined;

  /**
   * Observes the status of a notification event.
   * @param eventId The ID of the event to observe
   * @returns An observable that emits status updates for the event
   */
  observeEventStatus(eventId: string): Observable<INotificationStatus>;
}

/**
 * Interface for notification event handlers that support retry operations.
 * Extends the base notification event handler with retry capabilities.
 */
export interface IRetryableNotificationEventHandler extends INotificationEventHandler, IRetryableOperation {
  /**
   * Creates a retryable operation from a notification event.
   * @param event The notification event to create a retryable operation from
   * @returns A retryable operation that can be processed by the retry service
   */
  createRetryableOperation(event: INotificationEvent): IRetryableOperation;

  /**
   * Gets the maximum number of retry attempts for this handler.
   * @returns The maximum number of retry attempts
   */
  getMaxRetryAttempts(): number;

  /**
   * Handles a failed notification event after all retry attempts are exhausted.
   * @param event The notification event that failed
   * @param error The error that caused the failure
   * @returns A promise resolving to a notification event response
   */
  handleFailedEvent(event: INotificationEvent, error: Error): Promise<INotificationEventResponse>;
}

/**
 * Interface for notification event handlers that support fallback delivery channels.
 * Enables graceful degradation when primary delivery channels fail.
 */
export interface IFallbackNotificationEventHandler extends INotificationEventHandler {
  /**
   * Gets the fallback handlers for this notification handler.
   * @returns Array of fallback handlers in priority order
   */
  getFallbackHandlers(): INotificationEventHandler[];

  /**
   * Attempts to deliver a notification using fallback handlers.
   * @param event The notification event to deliver
   * @param error The error from the primary delivery attempt
   * @returns A promise resolving to a notification event response
   */
  attemptFallbackDelivery(event: INotificationEvent, error: Error): Promise<INotificationEventResponse>;

  /**
   * Determines if fallback delivery should be attempted for a given error.
   * @param error The error to check
   * @returns True if fallback delivery should be attempted, false otherwise
   */
  shouldAttemptFallback(error: Error): boolean;
}