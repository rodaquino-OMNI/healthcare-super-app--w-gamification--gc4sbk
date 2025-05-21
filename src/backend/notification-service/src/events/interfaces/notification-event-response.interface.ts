/**
 * @file notification-event-response.interface.ts
 * @description Defines interfaces for structured responses to notification event processing,
 * ensuring consistent result formats throughout the notification service.
 */

import { ErrorType } from '@austa/errors';

/**
 * Enum representing the delivery status of a notification
 */
export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',       // Notification is queued for delivery
  DELIVERED = 'DELIVERED',   // Successfully delivered to the recipient
  FAILED = 'FAILED',         // Delivery failed but may be retried
  REJECTED = 'REJECTED',     // Permanently rejected (e.g., invalid recipient)
  EXPIRED = 'EXPIRED',       // Delivery window expired
  UNKNOWN = 'UNKNOWN'        // Status could not be determined
}

/**
 * Base interface for all notification event responses
 */
export interface INotificationEventResponse {
  /**
   * Unique identifier for the notification
   */
  notificationId: string;

  /**
   * Correlation ID for tracking the notification through the system
   */
  correlationId: string;

  /**
   * Timestamp when the response was generated
   */
  timestamp: Date;

  /**
   * Indicates if the notification was successfully processed
   */
  success: boolean;

  /**
   * Current delivery status of the notification
   */
  status: NotificationDeliveryStatus;

  /**
   * Channel through which the notification was sent (email, sms, push, in-app)
   */
  channel: string;

  /**
   * Recipient identifier (email, phone number, device token, user ID)
   */
  recipient: string;

  /**
   * Optional metadata specific to the notification channel
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for successful notification delivery responses
 */
export interface INotificationSuccess extends INotificationEventResponse {
  success: true;
  status: NotificationDeliveryStatus.DELIVERED;
  
  /**
   * Provider-specific delivery reference (e.g., message ID from email provider)
   */
  providerReference?: string;
  
  /**
   * Timestamp when the notification was delivered
   */
  deliveredAt: Date;
  
  /**
   * Channel-specific delivery details
   */
  deliveryDetails?: IDeliveryDetails;
}

/**
 * Interface for failed notification delivery responses
 */
export interface INotificationError extends INotificationEventResponse {
  success: false;
  status: NotificationDeliveryStatus.FAILED | NotificationDeliveryStatus.REJECTED | NotificationDeliveryStatus.EXPIRED;
  
  /**
   * Error information
   */
  error: INotificationErrorDetails;
  
  /**
   * Retry information if applicable
   */
  retry?: IRetryInfo;
}

/**
 * Interface for detailed error information
 */
export interface INotificationErrorDetails {
  /**
   * Error message describing what went wrong
   */
  message: string;
  
  /**
   * Error code for programmatic handling
   */
  code: string;
  
  /**
   * Type of error for categorization
   */
  type: ErrorType;
  
  /**
   * Provider-specific error details
   */
  providerError?: {
    code?: string;
    message?: string;
    response?: any;
  };
  
  /**
   * Stack trace for debugging (only included in development)
   */
  stack?: string;
}

/**
 * Interface for retry information
 */
export interface IRetryInfo {
  /**
   * Number of retry attempts made so far
   */
  attemptsMade: number;
  
  /**
   * Maximum number of retry attempts allowed
   */
  maxAttempts: number;
  
  /**
   * Whether the notification is eligible for retry
   */
  isRetryable: boolean;
  
  /**
   * Timestamp when the next retry will be attempted
   */
  nextRetryAt?: Date;
  
  /**
   * Backoff strategy being used (e.g., 'exponential', 'fixed')
   */
  backoffStrategy?: string;
}

/**
 * Interface for channel-specific delivery details
 */
export interface IDeliveryDetails {
  /**
   * Email-specific delivery details
   */
  email?: IEmailDeliveryDetails;
  
  /**
   * SMS-specific delivery details
   */
  sms?: ISmsDeliveryDetails;
  
  /**
   * Push notification-specific delivery details
   */
  push?: IPushDeliveryDetails;
  
  /**
   * In-app notification-specific delivery details
   */
  inApp?: IInAppDeliveryDetails;
}

/**
 * Interface for email delivery details
 */
export interface IEmailDeliveryDetails {
  /**
   * Email provider message ID
   */
  messageId: string;
  
  /**
   * Email open tracking information
   */
  openTracking?: {
    enabled: boolean;
    opened?: boolean;
    openedAt?: Date;
  };
  
  /**
   * Email link click tracking information
   */
  clickTracking?: {
    enabled: boolean;
    clicked?: boolean;
    clickedAt?: Date;
    clickedLink?: string;
  };
}

/**
 * Interface for SMS delivery details
 */
export interface ISmsDeliveryDetails {
  /**
   * SMS provider message ID
   */
  messageId: string;
  
  /**
   * Delivery receipt information
   */
  deliveryReceipt?: {
    status: string;
    timestamp?: Date;
  };
  
  /**
   * Number of SMS segments used
   */
  segments?: number;
}

/**
 * Interface for push notification delivery details
 */
export interface IPushDeliveryDetails {
  /**
   * Push provider message ID
   */
  messageId: string;
  
  /**
   * Device information
   */
  device?: {
    type: string;
    token: string;
  };
  
  /**
   * Notification interaction tracking
   */
  interaction?: {
    delivered: boolean;
    opened?: boolean;
    openedAt?: Date;
  };
}

/**
 * Interface for in-app notification delivery details
 */
export interface IInAppDeliveryDetails {
  /**
   * Internal message ID
   */
  messageId: string;
  
  /**
   * Notification read status
   */
  readStatus?: {
    read: boolean;
    readAt?: Date;
  };
  
  /**
   * User interaction with the notification
   */
  interaction?: {
    clicked: boolean;
    clickedAt?: Date;
    dismissed: boolean;
    dismissedAt?: Date;
  };
}

/**
 * Interface for dead letter queue entry when notification permanently fails
 */
export interface INotificationDLQEntry {
  /**
   * Original notification event response
   */
  response: INotificationError;
  
  /**
   * Original notification payload
   */
  originalPayload: any;
  
  /**
   * Timestamp when the notification was moved to DLQ
   */
  enqueuedAt: Date;
  
  /**
   * Reason for moving to DLQ
   */
  reason: string;
  
  /**
   * Complete retry history
   */
  retryHistory: {
    attemptNumber: number;
    timestamp: Date;
    error: INotificationErrorDetails;
  }[];
}