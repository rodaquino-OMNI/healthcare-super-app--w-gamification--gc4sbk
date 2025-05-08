/**
 * @file notification-event-response.interface.ts
 * @description Defines interfaces for structured responses to notification event processing,
 * ensuring consistent result formats throughout the notification service. Contains interfaces
 * for standardized success and error responses, delivery status details, and metadata for tracking,
 * which are crucial for proper integration with the retry subsystem and dead-letter queues.
 */

import { NotificationChannel, NotificationType } from '@austa/interfaces/notification/types';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';
import { NotificationErrorCategory, NotificationErrorSeverity, INotificationError } from './notification-status.interface';

/**
 * Base interface for notification event processing responses.
 * Provides a standardized structure for all notification event processing results.
 */
export interface INotificationEventResponse {
  /** Unique identifier for the notification event response */
  responseId: string;
  
  /** ID of the notification being processed */
  notificationId: string;
  
  /** ID of the event that triggered this notification */
  eventId: string;
  
  /** User ID of the recipient */
  userId: string;
  
  /** Type of notification */
  notificationType: NotificationType;
  
  /** Channel used for delivery */
  channel: NotificationChannel;
  
  /** Whether the notification processing was successful */
  success: boolean;
  
  /** Timestamp when the response was generated */
  timestamp: Date;
  
  /** Time taken to process the notification in milliseconds */
  processingTimeMs: number;
  
  /** Current retry status if applicable */
  retryStatus?: RetryStatus;
  
  /** Number of delivery attempts made so far */
  attemptCount: number;
  
  /** Correlation ID for tracing and monitoring */
  correlationId: string;
  
  /** Journey context for the notification */
  journeyContext?: string;
  
  /** Additional metadata for the response */
  metadata?: Record<string, any>;
}

/**
 * Interface for successful notification event processing responses.
 * Extends the base response with success-specific fields.
 */
export interface INotificationSuccess extends INotificationEventResponse {
  /** Notification processing was successful */
  success: true;
  
  /** Timestamp when the notification was delivered */
  deliveredAt: Date;
  
  /** Provider-specific message ID or reference */
  providerMessageId?: string;
  
  /** Provider used for delivery (e.g., SendGrid, Twilio, FCM) */
  provider: string;
  
  /** Channel-specific delivery details */
  deliveryDetails: IChannelDeliveryDetails;
  
  /** Whether delivery confirmation was received from the provider */
  deliveryConfirmed: boolean;
  
  /** Timestamp when delivery was confirmed (if applicable) */
  deliveryConfirmedAt?: Date;
}

/**
 * Interface for failed notification event processing responses.
 * Extends the base response with error-specific fields.
 */
export interface INotificationError extends INotificationEventResponse {
  /** Notification processing failed */
  success: false;
  
  /** Detailed error information */
  error: INotificationError;
  
  /** Whether this error is eligible for retry */
  isRetryable: boolean;
  
  /** Recommended backoff time in milliseconds before retry */
  recommendedBackoffMs?: number;
  
  /** Whether the maximum retry attempts have been reached */
  isMaxAttemptsReached: boolean;
  
  /** Whether this notification should be moved to the dead letter queue */
  shouldMoveToDeadLetterQueue: boolean;
  
  /** Fallback channels that could be attempted (if applicable) */
  fallbackChannels?: NotificationChannel[];
  
  /** Provider that reported the error (if applicable) */
  provider?: string;
  
  /** Raw error response from the provider (if available) */
  rawProviderError?: Record<string, any>;
}

/**
 * Union type for notification event responses.
 * Represents either a successful or failed notification event processing result.
 */
export type NotificationEventResponse = INotificationSuccess | INotificationError;

/**
 * Interface for channel-specific delivery details.
 * Contains fields that vary based on the notification channel.
 */
export interface IChannelDeliveryDetails {
  /** Channel used for delivery */
  channel: NotificationChannel;
  
  /** Channel-specific metadata */
  metadata: Record<string, any>;
}

/**
 * Interface for email delivery details.
 * Contains email-specific delivery information.
 */
export interface IEmailDeliveryDetails extends IChannelDeliveryDetails {
  /** Email channel */
  channel: NotificationChannel.EMAIL;
  
  /** Email address of the recipient */
  recipientEmail: string;
  
  /** Email delivery provider used */
  provider: string;
  
  /** Message ID assigned by the email provider */
  messageId?: string;
  
  /** Whether the email was delivered to the recipient's server */
  deliveredToServer: boolean;
  
  /** Whether open tracking is enabled for this email */
  openTrackingEnabled?: boolean;
  
  /** Whether click tracking is enabled for this email */
  clickTrackingEnabled?: boolean;
}

/**
 * Interface for SMS delivery details.
 * Contains SMS-specific delivery information.
 */
export interface ISmsDeliveryDetails extends IChannelDeliveryDetails {
  /** SMS channel */
  channel: NotificationChannel.SMS;
  
  /** Phone number of the recipient */
  recipientPhone: string;
  
  /** SMS delivery provider used */
  provider: string;
  
  /** Message ID assigned by the SMS provider */
  messageId?: string;
  
  /** Delivery status code from the provider */
  providerStatusCode?: string;
  
  /** Cost of sending the SMS (for billing and quota tracking) */
  cost?: number;
  
  /** Currency of the cost amount */
  costCurrency?: string;
}

/**
 * Interface for push notification delivery details.
 * Contains push-specific delivery information.
 */
export interface IPushDeliveryDetails extends IChannelDeliveryDetails {
  /** Push channel */
  channel: NotificationChannel.PUSH;
  
  /** Device token or registration ID */
  deviceToken: string;
  
  /** Push notification provider used */
  provider: string;
  
  /** Message ID assigned by the push provider */
  messageId?: string;
  
  /** Platform of the recipient device */
  platform?: 'iOS' | 'Android' | 'Web';
  
  /** Whether high priority delivery was used */
  highPriority?: boolean;
  
  /** Time-to-live in seconds for the push notification */
  ttlSeconds?: number;
}

/**
 * Interface for in-app notification delivery details.
 * Contains in-app specific delivery information.
 */
export interface IInAppDeliveryDetails extends IChannelDeliveryDetails {
  /** In-app channel */
  channel: NotificationChannel.IN_APP;
  
  /** Whether the notification is marked as read */
  isRead: boolean;
  
  /** Whether the notification requires user action */
  requiresAction?: boolean;
  
  /** Expiration time for the notification (if applicable) */
  expiresAt?: Date;
  
  /** UI location where the notification should be displayed */
  displayLocation?: 'feed' | 'toast' | 'banner' | 'modal';
}

/**
 * Type union of all channel-specific delivery details interfaces.
 * Useful for functions that need to handle any type of delivery details.
 */
export type ChannelDeliveryDetails =
  | IEmailDeliveryDetails
  | ISmsDeliveryDetails
  | IPushDeliveryDetails
  | IInAppDeliveryDetails;

/**
 * Interface for asynchronous notification response tracking.
 * Used for notifications that have a delayed delivery confirmation.
 */
export interface IAsyncNotificationResponse extends INotificationEventResponse {
  /** Indicates this is an asynchronous response */
  isAsync: true;
  
  /** Estimated time when the final response will be available */
  estimatedCompletionTime?: Date;
  
  /** Callback URL for delivery status updates (if applicable) */
  statusCallbackUrl?: string;
  
  /** Token for querying the status later */
  statusQueryToken: string;
  
  /** Current processing stage */
  processingStage: 'queued' | 'processing' | 'delivering' | 'awaiting_confirmation';
}

/**
 * Interface for batch notification processing results.
 * Used when processing multiple notifications in a single operation.
 */
export interface IBatchNotificationResult {
  /** Total number of notifications in the batch */
  totalCount: number;
  
  /** Number of successfully processed notifications */
  successCount: number;
  
  /** Number of failed notifications */
  failureCount: number;
  
  /** Individual results for each notification */
  results: NotificationEventResponse[];
  
  /** Batch processing start time */
  startTime: Date;
  
  /** Batch processing end time */
  endTime: Date;
  
  /** Total processing time in milliseconds */
  totalProcessingTimeMs: number;
  
  /** Batch correlation ID for tracing and monitoring */
  batchCorrelationId: string;
}

/**
 * Type guard to check if a response is a success response.
 * @param response The notification event response to check
 * @returns True if the response is a success response
 */
export function isNotificationSuccess(
  response: NotificationEventResponse,
): response is INotificationSuccess {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response.
 * @param response The notification event response to check
 * @returns True if the response is an error response
 */
export function isNotificationError(
  response: NotificationEventResponse,
): response is INotificationError {
  return response.success === false;
}

/**
 * Type guard to check if a response is an asynchronous response.
 * @param response The notification event response to check
 * @returns True if the response is an asynchronous response
 */
export function isAsyncNotificationResponse(
  response: NotificationEventResponse,
): response is IAsyncNotificationResponse {
  return 'isAsync' in response && response['isAsync'] === true;
}

/**
 * Type guard to check if delivery details are for email.
 * @param details The delivery details to check
 * @returns True if the details are for email delivery
 */
export function isEmailDeliveryDetails(
  details: ChannelDeliveryDetails,
): details is IEmailDeliveryDetails {
  return details.channel === NotificationChannel.EMAIL;
}

/**
 * Type guard to check if delivery details are for SMS.
 * @param details The delivery details to check
 * @returns True if the details are for SMS delivery
 */
export function isSmsDeliveryDetails(
  details: ChannelDeliveryDetails,
): details is ISmsDeliveryDetails {
  return details.channel === NotificationChannel.SMS;
}

/**
 * Type guard to check if delivery details are for push notifications.
 * @param details The delivery details to check
 * @returns True if the details are for push notification delivery
 */
export function isPushDeliveryDetails(
  details: ChannelDeliveryDetails,
): details is IPushDeliveryDetails {
  return details.channel === NotificationChannel.PUSH;
}

/**
 * Type guard to check if delivery details are for in-app notifications.
 * @param details The delivery details to check
 * @returns True if the details are for in-app notification delivery
 */
export function isInAppDeliveryDetails(
  details: ChannelDeliveryDetails,
): details is IInAppDeliveryDetails {
  return details.channel === NotificationChannel.IN_APP;
}