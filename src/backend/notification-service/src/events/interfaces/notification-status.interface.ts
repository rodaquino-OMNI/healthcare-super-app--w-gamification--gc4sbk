/**
 * Notification Status Interfaces
 * 
 * This file defines interfaces for tracking notification delivery status across various channels.
 * It provides type definitions for the complete notification lifecycle from dispatch through
 * delivery or failure, enabling robust tracking, monitoring, and recovery from notification
 * delivery failures with proper integration with the retry subsystem.
 * 
 * Part of the AUSTA SuperApp refactoring to implement standardized status tracking with
 * support for retry mechanisms, dead letter queues, and enhanced monitoring.
 */

import { NotificationType, NotificationPriority } from '@austa/interfaces/notification';
import { DeliveryChannel, DeliveryStatusType } from '../../interfaces/delivery-tracking.interface';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';

/**
 * Error severity levels for notification delivery failures
 * Used to determine appropriate retry strategies
 */
export enum ErrorSeverity {
  /**
   * Temporary issue that is likely to resolve on retry
   * Examples: network timeout, temporary service unavailability
   */
  TRANSIENT = 'transient',
  
  /**
   * Issue with the notification itself that won't be resolved by retrying
   * Examples: invalid email format, malformed payload
   */
  PERMANENT = 'permanent',
  
  /**
   * Issue with the external provider that may require intervention
   * Examples: authentication failure, account suspension
   */
  PROVIDER = 'provider',
  
  /**
   * Internal system error
   * Examples: database connection failure, out of memory
   */
  SYSTEM = 'system'
}

/**
 * Error categories for notification delivery failures
 * Provides more detailed classification for monitoring and retry decisions
 */
export enum ErrorCategory {
  // Network related errors
  NETWORK_TIMEOUT = 'network_timeout',
  NETWORK_DISCONNECT = 'network_disconnect',
  DNS_RESOLUTION = 'dns_resolution',
  
  // Rate limiting and throttling
  RATE_LIMITED = 'rate_limited',
  QUOTA_EXCEEDED = 'quota_exceeded',
  THROTTLED = 'throttled',
  
  // Authentication and authorization
  AUTH_FAILURE = 'auth_failure',
  CREDENTIALS_EXPIRED = 'credentials_expired',
  PERMISSION_DENIED = 'permission_denied',
  
  // Content and validation
  INVALID_PAYLOAD = 'invalid_payload',
  CONTENT_REJECTED = 'content_rejected',
  SIZE_EXCEEDED = 'size_exceeded',
  
  // Recipient issues
  INVALID_RECIPIENT = 'invalid_recipient',
  RECIPIENT_OPTED_OUT = 'recipient_opted_out',
  RECIPIENT_UNREACHABLE = 'recipient_unreachable',
  
  // Provider issues
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  PROVIDER_REJECTED = 'provider_rejected',
  PROVIDER_ERROR = 'provider_error',
  
  // System issues
  DATABASE_ERROR = 'database_error',
  INTERNAL_ERROR = 'internal_error',
  DEPENDENCY_FAILURE = 'dependency_failure',
  
  // Unknown
  UNKNOWN = 'unknown'
}

/**
 * Interface for error details in notification status
 * Provides comprehensive information about delivery failures
 */
export interface INotificationError {
  /**
   * Error code from the provider or system
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Detailed error category
   */
  category: ErrorCategory;
  
  /**
   * Original error object or stack trace (if available)
   */
  originalError?: any;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;
  
  /**
   * Context information for debugging
   */
  context?: Record<string, any>;
  
  /**
   * Recommended action to resolve the error
   */
  recommendedAction?: string;
  
  /**
   * Flag indicating if this error is retryable
   */
  isRetryable: boolean;
}

/**
 * Base interface for notification status
 * Common properties shared by all notification status types
 */
export interface INotificationStatusBase {
  /**
   * Unique identifier for the notification
   */
  notificationId: string;
  
  /**
   * Transaction ID for cross-service correlation
   */
  transactionId: string;
  
  /**
   * ID of the user who will receive this notification
   */
  userId: string;
  
  /**
   * Type of notification
   */
  type: NotificationType;
  
  /**
   * Priority of the notification
   */
  priority: NotificationPriority;
  
  /**
   * Journey context for this notification (health, care, plan)
   */
  journeyContext: string;
  
  /**
   * Current delivery status
   */
  status: DeliveryStatusType;
  
  /**
   * Primary delivery channel
   */
  primaryChannel: DeliveryChannel;
  
  /**
   * Fallback channels in order of preference
   */
  fallbackChannels?: DeliveryChannel[];
  
  /**
   * Timestamp when the notification was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the notification status was last updated
   */
  updatedAt: Date;
  
  /**
   * Timestamp when the notification was successfully delivered (if applicable)
   */
  deliveredAt?: Date;
  
  /**
   * Timestamp when the notification was marked as failed (if applicable)
   */
  failedAt?: Date;
  
  /**
   * Number of delivery attempts made so far
   */
  attemptCount: number;
  
  /**
   * Maximum number of attempts allowed before giving up
   */
  maxAttempts: number;
  
  /**
   * Current retry status if applicable
   */
  retryStatus?: RetryStatus;
  
  /**
   * Next scheduled retry time if in retry state
   */
  nextRetryAt?: Date;
  
  /**
   * Error information if the notification failed
   */
  error?: INotificationError;
}

/**
 * Interface for comprehensive notification status tracking
 * Extends the base status with channel-specific status information
 */
export interface INotificationStatus extends INotificationStatusBase {
  /**
   * Channel-specific delivery statuses
   */
  channelStatus: {
    [channel in DeliveryChannel]?: IChannelStatus;
  };
  
  /**
   * Dead letter queue information if the notification was moved to DLQ
   */
  dlq?: IDeadLetterQueueInfo;
  
  /**
   * Metrics for this notification
   */
  metrics: INotificationMetrics;
}

/**
 * Interface for channel-specific status information
 */
export interface IChannelStatus {
  /**
   * Current status for this channel
   */
  status: DeliveryStatusType;
  
  /**
   * Timestamp of the first attempt on this channel
   */
  firstAttemptAt?: Date;
  
  /**
   * Timestamp of the last attempt on this channel
   */
  lastAttemptAt?: Date;
  
  /**
   * Number of attempts on this channel
   */
  attemptCount: number;
  
  /**
   * Provider-specific response code (if available)
   */
  providerResponseCode?: string;
  
  /**
   * Provider-specific response message (if available)
   */
  providerResponseMessage?: string;
  
  /**
   * Error information if delivery on this channel failed
   */
  error?: INotificationError;
  
  /**
   * Retry information for this channel
   */
  retry?: {
    /**
     * Current retry status
     */
    status: RetryStatus;
    
    /**
     * Next scheduled retry time
     */
    nextRetryAt?: Date;
    
    /**
     * Retry strategy being used
     */
    strategy: string;
    
    /**
     * Current backoff delay in milliseconds
     */
    currentBackoffMs: number;
  };
}

/**
 * Interface for email-specific status information
 */
export interface IEmailStatus extends IChannelStatus {
  /**
   * Email-specific delivery information
   */
  email: {
    /**
     * Recipient email address
     */
    recipient: string;
    
    /**
     * Email subject
     */
    subject: string;
    
    /**
     * Email tracking ID if available
     */
    trackingId?: string;
    
    /**
     * Email open tracking status
     */
    opened?: boolean;
    
    /**
     * Timestamp when the email was opened (if tracked and opened)
     */
    openedAt?: Date;
    
    /**
     * Click tracking status
     */
    clicked?: boolean;
    
    /**
     * Timestamp when a link in the email was clicked (if tracked and clicked)
     */
    clickedAt?: Date;
    
    /**
     * Bounce information if the email bounced
     */
    bounce?: {
      /**
       * Type of bounce (hard/soft)
       */
      type: 'hard' | 'soft';
      
      /**
       * Reason for the bounce
       */
      reason: string;
      
      /**
       * Timestamp when the bounce occurred
       */
      timestamp: Date;
    };
  };
}

/**
 * Interface for SMS-specific status information
 */
export interface ISmsStatus extends IChannelStatus {
  /**
   * SMS-specific delivery information
   */
  sms: {
    /**
     * Recipient phone number
     */
    recipient: string;
    
    /**
     * SMS provider message ID
     */
    messageId?: string;
    
    /**
     * Delivery receipt status
     */
    deliveryReceipt?: {
      /**
       * Status from the carrier
       */
      status: string;
      
      /**
       * Timestamp of the delivery receipt
       */
      timestamp: Date;
      
      /**
       * Error code if delivery failed
       */
      errorCode?: string;
    };
  };
}

/**
 * Interface for push notification-specific status information
 */
export interface IPushStatus extends IChannelStatus {
  /**
   * Push-specific delivery information
   */
  push: {
    /**
     * Device token or registration ID
     */
    token: string;
    
    /**
     * Device platform (ios, android, web)
     */
    platform: 'ios' | 'android' | 'web';
    
    /**
     * Push provider message ID
     */
    messageId?: string;
    
    /**
     * Delivery receipt information
     */
    deliveryReceipt?: {
      /**
       * Status from the provider
       */
      status: string;
      
      /**
       * Timestamp of the delivery receipt
       */
      timestamp: Date;
    };
    
    /**
     * Notification open tracking
     */
    opened?: boolean;
    
    /**
     * Timestamp when the push notification was opened
     */
    openedAt?: Date;
    
    /**
     * Token validity status
     */
    tokenValid: boolean;
  };
}

/**
 * Interface for in-app notification-specific status information
 */
export interface IInAppStatus extends IChannelStatus {
  /**
   * In-app specific delivery information
   */
  inApp: {
    /**
     * Whether the notification is currently visible in the app
     */
    visible: boolean;
    
    /**
     * Whether the notification has been read by the user
     */
    read: boolean;
    
    /**
     * Timestamp when the notification was read
     */
    readAt?: Date;
    
    /**
     * Whether the notification has been dismissed by the user
     */
    dismissed: boolean;
    
    /**
     * Timestamp when the notification was dismissed
     */
    dismissedAt?: Date;
    
    /**
     * Whether the notification has been clicked/acted upon
     */
    clicked: boolean;
    
    /**
     * Timestamp when the notification was clicked
     */
    clickedAt?: Date;
    
    /**
     * Expiration time for the in-app notification
     */
    expiresAt?: Date;
  };
}

/**
 * Interface for dead letter queue information
 */
export interface IDeadLetterQueueInfo {
  /**
   * Timestamp when the notification was moved to DLQ
   */
  queuedAt: Date;
  
  /**
   * Reason for moving to DLQ
   */
  reason: string;
  
  /**
   * Queue name where the notification was moved
   */
  queueName: string;
  
  /**
   * Entry ID in the dead letter queue
   */
  entryId: string;
  
  /**
   * Maximum retention time in the DLQ
   */
  retentionUntil: Date;
  
  /**
   * Number of processing attempts before moving to DLQ
   */
  attemptsBeforeDlq: number;
  
  /**
   * Last error that caused the notification to be moved to DLQ
   */
  lastError: INotificationError;
  
  /**
   * Manual resolution status
   */
  resolution?: {
    /**
     * Status of the resolution
     */
    status: 'pending' | 'resolved' | 'rejected';
    
    /**
     * User who resolved the issue
     */
    resolvedBy?: string;
    
    /**
     * Timestamp when the issue was resolved
     */
    resolvedAt?: Date;
    
    /**
     * Resolution notes
     */
    notes?: string;
    
    /**
     * Action taken to resolve the issue
     */
    action?: 'retry' | 'discard' | 'modify_and_retry';
  };
}

/**
 * Interface for notification metrics
 */
export interface INotificationMetrics {
  /**
   * Total time from creation to delivery (or current time if not delivered)
   */
  totalProcessingTimeMs: number;
  
  /**
   * Time spent in each delivery status
   */
  timeInStatus: {
    [status in DeliveryStatusType]?: number;
  };
  
  /**
   * Time spent in each channel
   */
  timeInChannel: {
    [channel in DeliveryChannel]?: number;
  };
  
  /**
   * Number of channel fallbacks used
   */
  channelFallbackCount: number;
  
  /**
   * Number of retry attempts by channel
   */
  retryCountByChannel: {
    [channel in DeliveryChannel]?: number;
  };
  
  /**
   * Total retry count across all channels
   */
  totalRetryCount: number;
  
  /**
   * Delivery success rate (0-1)
   */
  successRate: number;
}

/**
 * Interface for notification status update events
 */
export interface INotificationStatusUpdate {
  /**
   * Notification ID being updated
   */
  notificationId: string;
  
  /**
   * Transaction ID for correlation
   */
  transactionId: string;
  
  /**
   * New status
   */
  status: DeliveryStatusType;
  
  /**
   * Channel being updated
   */
  channel: DeliveryChannel;
  
  /**
   * Timestamp of the update
   */
  timestamp: Date;
  
  /**
   * Provider-specific response information
   */
  providerResponse?: {
    code?: string;
    message?: string;
    data?: any;
  };
  
  /**
   * Error information if status is failed
   */
  error?: INotificationError;
  
  /**
   * Channel-specific status details
   */
  channelSpecificDetails?: any;
}

/**
 * Interface for notification status query filters
 */
export interface INotificationStatusFilter {
  /**
   * Filter by notification ID
   */
  notificationId?: string;
  
  /**
   * Filter by transaction ID
   */
  transactionId?: string;
  
  /**
   * Filter by user ID
   */
  userId?: string;
  
  /**
   * Filter by notification type
   */
  type?: NotificationType;
  
  /**
   * Filter by status
   */
  status?: DeliveryStatusType | DeliveryStatusType[];
  
  /**
   * Filter by channel
   */
  channel?: DeliveryChannel | DeliveryChannel[];
  
  /**
   * Filter by journey context
   */
  journeyContext?: string;
  
  /**
   * Filter by creation date range
   */
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  
  /**
   * Filter by delivery date range
   */
  deliveredAt?: {
    from?: Date;
    to?: Date;
  };
  
  /**
   * Filter by error severity
   */
  errorSeverity?: ErrorSeverity;
  
  /**
   * Filter by error category
   */
  errorCategory?: ErrorCategory;
  
  /**
   * Filter by retry status
   */
  retryStatus?: RetryStatus;
  
  /**
   * Filter by DLQ status
   */
  inDeadLetterQueue?: boolean;
}

/**
 * Interface for aggregated notification status metrics
 */
export interface INotificationStatusMetrics {
  /**
   * Total number of notifications
   */
  total: number;
  
  /**
   * Count by status
   */
  byStatus: {
    [status in DeliveryStatusType]: number;
  };
  
  /**
   * Count by channel
   */
  byChannel: {
    [channel in DeliveryChannel]: number;
  };
  
  /**
   * Count by notification type
   */
  byType: {
    [type in NotificationType]: number;
  };
  
  /**
   * Count by journey context
   */
  byJourneyContext: Record<string, number>;
  
  /**
   * Count by error severity
   */
  byErrorSeverity: {
    [severity in ErrorSeverity]: number;
  };
  
  /**
   * Count by error category
   */
  byErrorCategory: {
    [category in ErrorCategory]: number;
  };
  
  /**
   * Count by retry status
   */
  byRetryStatus: {
    [status in RetryStatus]: number;
  };
  
  /**
   * Average metrics
   */
  averages: {
    /**
     * Average delivery time in milliseconds
     */
    deliveryTimeMs: number;
    
    /**
     * Average number of attempts
     */
    attempts: number;
    
    /**
     * Average number of channel fallbacks
     */
    channelFallbacks: number;
    
    /**
     * Average number of retries
     */
    retries: number;
  };
  
  /**
   * Success rates
   */
  successRates: {
    /**
     * Overall success rate
     */
    overall: number;
    
    /**
     * Success rate by channel
     */
    byChannel: {
      [channel in DeliveryChannel]: number;
    };
    
    /**
     * Success rate by notification type
     */
    byType: {
      [type in NotificationType]: number;
    };
    
    /**
     * Success rate by journey context
     */
    byJourneyContext: Record<string, number>;
  };
  
  /**
   * Dead letter queue metrics
   */
  dlq: {
    /**
     * Total count in DLQ
     */
    total: number;
    
    /**
     * Count by error category
     */
    byErrorCategory: {
      [category in ErrorCategory]: number;
    };
    
    /**
     * Count by channel
     */
    byChannel: {
      [channel in DeliveryChannel]: number;
    };
    
    /**
     * Count by resolution status
     */
    byResolutionStatus: {
      pending: number;
      resolved: number;
      rejected: number;
    };
  };
}