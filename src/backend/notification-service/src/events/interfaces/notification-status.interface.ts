/**
 * @file notification-status.interface.ts
 * @description Defines interfaces for tracking notification delivery status across various channels.
 * This file provides type definitions for the complete notification lifecycle from dispatch through
 * delivery or failure, enabling robust tracking, monitoring, and recovery from notification
 * delivery failures with proper integration with the retry subsystem.
 */

import { NotificationChannel, NotificationType } from '@austa/interfaces/notification/types';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';

/**
 * Error severity levels for notification delivery failures.
 * Used to determine appropriate retry strategies and alerting thresholds.
 */
export enum NotificationErrorSeverity {
  /** Minor issues that shouldn't affect delivery (e.g., non-critical metadata missing) */
  LOW = 'LOW',
  /** Issues that may affect delivery but aren't critical (e.g., temporary slowdowns) */
  MEDIUM = 'MEDIUM',
  /** Serious issues that likely prevented delivery (e.g., invalid recipient) */
  HIGH = 'HIGH',
  /** Critical system failures requiring immediate attention (e.g., service outage) */
  CRITICAL = 'CRITICAL',
}

/**
 * Error categories for notification delivery failures.
 * Used to classify errors for analytics, reporting, and retry strategy selection.
 */
export enum NotificationErrorCategory {
  /** Errors related to the notification content or format */
  CONTENT = 'CONTENT',
  /** Errors related to the recipient (e.g., invalid email, phone number) */
  RECIPIENT = 'RECIPIENT',
  /** Errors related to rate limiting or quotas */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Errors related to authentication with delivery providers */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Errors related to network connectivity */
  NETWORK = 'NETWORK',
  /** Errors related to the delivery provider's service */
  PROVIDER = 'PROVIDER',
  /** Errors related to the notification service itself */
  INTERNAL = 'INTERNAL',
  /** Unknown or unclassified errors */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Interface for detailed error information about notification delivery failures.
 * Provides structured data for error tracking, analysis, and intelligent retry decisions.
 */
export interface INotificationError {
  /** Error code from the delivery provider or internal system */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error category for classification and analytics */
  category: NotificationErrorCategory;
  /** Error severity level for prioritization and alerting */
  severity: NotificationErrorSeverity;
  /** Whether this error is considered transient and eligible for retry */
  isTransient: boolean;
  /** Raw error details from the provider for debugging (optional) */
  rawError?: Record<string, any>;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** Stack trace for internal errors (optional) */
  stack?: string;
}

/**
 * Base interface for notification status tracking.
 * Provides common fields for all notification channels.
 */
export interface INotificationStatus {
  /** Unique identifier for the notification */
  notificationId: string;
  /** User ID of the recipient */
  userId: string;
  /** Type of notification */
  type: NotificationType;
  /** Channel used for delivery */
  channel: NotificationChannel;
  /** Current status of the notification in the retry system */
  retryStatus: RetryStatus;
  /** Number of delivery attempts made */
  attempts: number;
  /** Maximum number of retry attempts configured */
  maxAttempts: number;
  /** Timestamp when the notification was created */
  createdAt: Date;
  /** Timestamp when the notification was last updated */
  updatedAt: Date;
  /** Timestamp when the notification was dispatched (if applicable) */
  dispatchedAt?: Date;
  /** Timestamp when the notification was delivered (if applicable) */
  deliveredAt?: Date;
  /** Timestamp when the notification was read/acknowledged (if applicable) */
  readAt?: Date;
  /** Timestamp when the notification failed permanently (if applicable) */
  failedAt?: Date;
  /** Error information if delivery failed */
  error?: INotificationError;
  /** Whether the notification has been moved to the dead letter queue */
  isInDeadLetterQueue: boolean;
  /** Journey context for the notification */
  journeyContext?: string;
  /** Additional metadata specific to the notification */
  metadata?: Record<string, any>;
}

/**
 * Interface for email notification status tracking.
 * Extends the base notification status with email-specific fields.
 */
export interface IEmailNotificationStatus extends INotificationStatus {
  /** Email address of the recipient */
  recipientEmail: string;
  /** Email delivery provider used (e.g., SMTP, SendGrid, AWS SES) */
  provider: string;
  /** Message ID assigned by the email provider */
  messageId?: string;
  /** Whether the email was opened by the recipient */
  isOpened?: boolean;
  /** Timestamp when the email was opened (if tracked) */
  openedAt?: Date;
  /** Whether any links in the email were clicked */
  isClicked?: boolean;
  /** Timestamp when a link was first clicked (if tracked) */
  clickedAt?: Date;
  /** Whether the email bounced */
  isBounced?: boolean;
  /** Whether it was a hard bounce (permanent) or soft bounce (temporary) */
  bounceType?: 'HARD' | 'SOFT';
  /** Whether the recipient marked the email as spam */
  isMarkedAsSpam?: boolean;
  /** Whether the email was successfully delivered to the recipient's server */
  isDeliveredToServer?: boolean;
}

/**
 * Interface for SMS notification status tracking.
 * Extends the base notification status with SMS-specific fields.
 */
export interface ISmsNotificationStatus extends INotificationStatus {
  /** Phone number of the recipient */
  recipientPhone: string;
  /** SMS delivery provider used (e.g., Twilio, AWS SNS) */
  provider: string;
  /** Message ID assigned by the SMS provider */
  messageId?: string;
  /** Delivery status code from the provider */
  providerStatusCode?: string;
  /** Whether the SMS was delivered to the recipient's device */
  isDeliveredToDevice?: boolean;
  /** Whether the SMS was undeliverable (e.g., invalid number) */
  isUndeliverable?: boolean;
  /** Reason for undeliverability (if applicable) */
  undeliverableReason?: string;
  /** Cost of sending the SMS (for billing and quota tracking) */
  cost?: number;
  /** Currency of the cost amount */
  costCurrency?: string;
}

/**
 * Interface for push notification status tracking.
 * Extends the base notification status with push-specific fields.
 */
export interface IPushNotificationStatus extends INotificationStatus {
  /** Device token or registration ID */
  deviceToken: string;
  /** Push notification provider used (e.g., FCM, APNS) */
  provider: string;
  /** Message ID assigned by the push provider */
  messageId?: string;
  /** Whether the push notification was delivered to the device */
  isDeliveredToDevice?: boolean;
  /** Whether the push notification was opened by the user */
  isOpened?: boolean;
  /** Timestamp when the push notification was opened */
  openedAt?: Date;
  /** Whether the device token is invalid or expired */
  isTokenInvalid?: boolean;
  /** Platform of the recipient device (iOS, Android, Web) */
  platform?: 'iOS' | 'Android' | 'Web';
  /** App version on the recipient device */
  appVersion?: string;
}

/**
 * Interface for in-app notification status tracking.
 * Extends the base notification status with in-app specific fields.
 */
export interface IInAppNotificationStatus extends INotificationStatus {
  /** Whether the notification is currently active/visible */
  isActive: boolean;
  /** Whether the notification has been read by the user */
  isRead: boolean;
  /** Whether the notification has been archived by the user */
  isArchived?: boolean;
  /** Timestamp when the notification was archived (if applicable) */
  archivedAt?: Date;
  /** Whether the user interacted with the notification */
  isInteracted?: boolean;
  /** Timestamp when the user first interacted with the notification */
  interactedAt?: Date;
  /** Action taken by the user (if applicable) */
  userAction?: string;
  /** Time spent viewing the notification (in milliseconds, if tracked) */
  viewDuration?: number;
}

/**
 * Interface for notification metrics collection.
 * Used for monitoring, alerting, and performance analysis.
 */
export interface INotificationMetrics {
  /** Total number of notifications sent */
  totalSent: number;
  /** Total number of notifications delivered successfully */
  totalDelivered: number;
  /** Total number of notifications that failed delivery */
  totalFailed: number;
  /** Total number of notifications in the dead letter queue */
  totalInDeadLetterQueue: number;
  /** Average delivery time in milliseconds */
  avgDeliveryTimeMs?: number;
  /** Success rate as a percentage */
  successRate: number;
  /** Metrics broken down by notification channel */
  byChannel: {
    [key in NotificationChannel]?: {
      sent: number;
      delivered: number;
      failed: number;
      successRate: number;
    };
  };
  /** Metrics broken down by notification type */
  byType: {
    [key in NotificationType]?: {
      sent: number;
      delivered: number;
      failed: number;
      successRate: number;
    };
  };
  /** Metrics broken down by error category */
  byErrorCategory: {
    [key in NotificationErrorCategory]?: number;
  };
  /** Time period these metrics cover */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Interface for dead letter queue integration.
 * Defines the structure for notifications that have failed delivery and exhausted retry attempts.
 */
export interface INotificationDlqEntry {
  /** The notification status record */
  status: INotificationStatus;
  /** Original notification payload */
  originalPayload: Record<string, any>;
  /** Complete history of delivery attempts */
  attemptHistory: Array<{
    /** Timestamp of the attempt */
    timestamp: Date;
    /** Error encountered during this attempt (if any) */
    error?: INotificationError;
    /** Duration of the attempt in milliseconds */
    durationMs: number;
    /** Additional context about the attempt */
    context?: Record<string, any>;
  }>;
  /** Reason the notification was moved to the DLQ */
  reason: string;
  /** Timestamp when the notification was moved to the DLQ */
  enqueuedAt: Date;
  /** Whether this entry has been processed or resolved */
  isResolved: boolean;
  /** Timestamp when this entry was resolved (if applicable) */
  resolvedAt?: Date;
  /** User who resolved this entry (if applicable) */
  resolvedBy?: string;
  /** Resolution action taken (if applicable) */
  resolutionAction?: 'RETRY' | 'DISCARD' | 'MANUAL_SEND' | 'OTHER';
  /** Notes about the resolution (if applicable) */
  resolutionNotes?: string;
}

/**
 * Type union of all channel-specific notification status interfaces.
 * Useful for functions that need to handle any type of notification status.
 */
export type NotificationStatus =
  | IEmailNotificationStatus
  | ISmsNotificationStatus
  | IPushNotificationStatus
  | IInAppNotificationStatus;

/**
 * Type guard to check if a notification status is for email.
 * @param status The notification status to check
 * @returns True if the status is for an email notification
 */
export function isEmailNotificationStatus(
  status: NotificationStatus,
): status is IEmailNotificationStatus {
  return status.channel === NotificationChannel.EMAIL;
}

/**
 * Type guard to check if a notification status is for SMS.
 * @param status The notification status to check
 * @returns True if the status is for an SMS notification
 */
export function isSmsNotificationStatus(
  status: NotificationStatus,
): status is ISmsNotificationStatus {
  return status.channel === NotificationChannel.SMS;
}

/**
 * Type guard to check if a notification status is for push.
 * @param status The notification status to check
 * @returns True if the status is for a push notification
 */
export function isPushNotificationStatus(
  status: NotificationStatus,
): status is IPushNotificationStatus {
  return status.channel === NotificationChannel.PUSH;
}

/**
 * Type guard to check if a notification status is for in-app.
 * @param status The notification status to check
 * @returns True if the status is for an in-app notification
 */
export function isInAppNotificationStatus(
  status: NotificationStatus,
): status is IInAppNotificationStatus {
  return status.channel === NotificationChannel.IN_APP;
}