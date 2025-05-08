/**
 * Interfaces for tracking notification delivery status across different channels.
 * These interfaces support enhanced retry policies and delivery monitoring.
 * 
 * Key features:
 * - Standardized delivery status tracking across all notification channels
 * - Retry-compatible tracking with attempt counters and timestamps
 * - Channel-specific delivery status indicators and metrics
 * - Transaction ID pattern for cross-service delivery correlation
 * - Integration with dead letter queue concepts for failed delivery handling
 * 
 * @module notification-service/interfaces/delivery-tracking
 */

import { RetryStatus } from '../retry/interfaces/retry-status.enum';

// Import from @austa/interfaces for standardized notification payload schemas
import { INotificationBase, IErrorContext } from '@austa/interfaces';

/**
 * Represents the possible delivery statuses for a notification
 * 
 * These statuses track the lifecycle of a notification from creation
 * through delivery (or failure). They provide a standardized way to
 * represent delivery status across different channels.
 */
export enum DeliveryStatus {
  /**
   * Initial state, not yet attempted delivery
   */
  PENDING = 'PENDING',
  
  /**
   * Currently in the process of being delivered
   */
  SENDING = 'SENDING',
  
  /**
   * Successfully delivered to the recipient
   */
  DELIVERED = 'DELIVERED',
  
  /**
   * Delivery failed but will be retried
   */
  FAILED = 'FAILED',
  
  /**
   * Permanently failed, no more retries
   * This status indicates the notification has been moved to the dead letter queue
   */
  UNDELIVERABLE = 'UNDELIVERABLE',
  
  /**
   * Delivered and read by the recipient (if tracking supported)
   * This status is only applicable for channels that support read receipts
   */
  READ = 'READ',
  
  /**
   * Delivery window expired before successful delivery
   * This occurs when a notification has a time-sensitive nature and
   * the delivery window has passed
   */
  EXPIRED = 'EXPIRED'
}

/**
 * Represents the possible error categories for delivery failures
 * 
 * These categories help classify errors for proper retry handling,
 * reporting, and analytics. Different error categories may trigger
 * different retry policies or fallback strategies.
 */
export enum DeliveryErrorCategory {
  /**
   * Error from the delivery provider (e.g., email service down)
   * Usually temporary and should be retried with backoff
   */
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  
  /**
   * Error related to the recipient (e.g., invalid email, phone number)
   * Usually permanent and should not be retried on the same channel
   */
  RECIPIENT_ERROR = 'RECIPIENT_ERROR',
  
  /**
   * Error related to the notification content (e.g., invalid template)
   * Usually requires fixing the content before retrying
   */
  CONTENT_ERROR = 'CONTENT_ERROR',
  
  /**
   * Rate limiting by the delivery provider
   * Should be retried after a delay based on provider requirements
   */
  RATE_LIMIT = 'RATE_LIMIT',
  
  /**
   * Network or connectivity issues
   * Usually temporary and should be retried with backoff
   */
  CONNECTIVITY = 'CONNECTIVITY',
  
  /**
   * Authentication issues with the provider
   * May require manual intervention before retrying
   */
  AUTHENTICATION = 'AUTHENTICATION',
  
  /**
   * Internal system errors
   * May be retried depending on the specific error
   */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  /**
   * Unknown or unclassified errors
   * Default category when the error cannot be classified
   */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Represents a single delivery attempt for a notification
 * 
 * This interface tracks detailed information about each individual attempt
 * to deliver a notification. It captures timestamps, error details, and
 * provider-specific information to support comprehensive retry logic and
 * delivery analytics.
 * 
 * Each notification may have multiple delivery attempts, especially when
 * retry policies are applied after failures.
 */
export interface IDeliveryAttempt {
  /**
   * Unique identifier for this delivery attempt
   */
  attemptId: string;
  
  /**
   * Timestamp when the delivery attempt started
   */
  timestamp: Date;
  
  /**
   * Duration of the delivery attempt in milliseconds
   */
  duration?: number;
  
  /**
   * Status of this delivery attempt
   */
  status: DeliveryStatus;
  
  /**
   * Error message if the delivery attempt failed
   */
  errorMessage?: string;
  
  /**
   * Error code from the delivery provider if available
   */
  errorCode?: string;
  
  /**
   * Category of the error for classification and analytics
   */
  errorCategory?: DeliveryErrorCategory;
  
  /**
   * Detailed error context for debugging and analysis
   * Uses the standardized error context interface from @austa/interfaces
   */
  errorContext?: IErrorContext;
  
  /**
   * Provider-specific response data
   */
  providerResponse?: Record<string, any>;
  
  /**
   * Retry information if this attempt is a retry
   */
  retryInfo?: {
    /**
     * Number of this attempt (1-based)
     */
    attemptNumber: number;
    
    /**
     * Delay before this retry in milliseconds
     */
    delayMs: number;
    
    /**
     * Name of the retry policy used
     */
    policyName: string;
  };
}

/**
 * Represents the current delivery status of a notification
 * 
 * This interface provides a snapshot of the current delivery state,
 * including status, timestamps, retry information, and channel-specific
 * details. It's used to track the current state of a notification's
 * delivery process and determine next steps (e.g., retry, move to DLQ).
 */
export interface IDeliveryStatus {
  /**
   * Current status of the notification delivery
   */
  status: DeliveryStatus;
  
  /**
   * Timestamp when the status was last updated
   */
  updatedAt: Date;
  
  /**
   * Timestamp when the notification was successfully delivered (if applicable)
   */
  deliveredAt?: Date;
  
  /**
   * Timestamp when the notification was read by the recipient (if applicable and tracked)
   */
  readAt?: Date;
  
  /**
   * Number of delivery attempts made so far
   */
  attemptCount: number;
  
  /**
   * Maximum number of delivery attempts allowed
   */
  maxAttempts: number;
  
  /**
   * Timestamp when the next retry is scheduled (if applicable)
   */
  nextRetryAt?: Date;
  
  /**
   * Status of the retry process
   */
  retryStatus: RetryStatus;
  
  /**
   * Reason for the current status (especially for failures)
   */
  statusReason?: string;
  
  /**
   * Channel-specific delivery status information
   */
  channelStatus?: {
    /**
     * Provider-specific status code
     */
    providerStatusCode?: string;
    
    /**
     * Provider-specific status message
     */
    providerStatusMessage?: string;
    
    /**
     * Additional channel-specific status details
     */
    details?: Record<string, any>;
  };
}

/**
 * Represents comprehensive tracking information for a notification's delivery lifecycle
 * 
 * This interface provides a complete view of a notification's delivery process,
 * including all attempts, current status, and metadata. It serves as the primary
 * record for notification delivery tracking and supports the enhanced retry
 * policies and delivery monitoring requirements.
 */
export interface IDeliveryTracking {
  /**
   * Unique identifier for the notification
   */
  notificationId: number | string;
  
  /**
   * Unique transaction ID for cross-service correlation
   * 
   * This ID is used to track the notification across different services and
   * enables correlation of logs, metrics, and events related to this notification.
   * It follows the format: `notif-{uuid}-{timestamp}`
   */
  transactionId: string;
  
  /**
   * ID of the user who will receive this notification
   */
  userId: string;
  
  /**
   * Delivery channel (e.g., 'push', 'email', 'sms', 'in-app')
   */
  channel: string;
  
  /**
   * Current delivery status
   */
  currentStatus: IDeliveryStatus;
  
  /**
   * History of all delivery attempts
   */
  attempts: IDeliveryAttempt[];
  
  /**
   * Timestamp when the notification was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the notification expires and should no longer be delivered
   */
  expiresAt?: Date;
  
  /**
   * Priority of the notification (higher priority may affect retry behavior)
   */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  
  /**
   * Journey context for the notification (e.g., 'health', 'care', 'plan', 'game')
   */
  journeyContext?: string;
  
  /**
   * Flag indicating if this notification has been moved to the dead letter queue
   */
  inDeadLetterQueue: boolean;
  
  /**
   * Timestamp when the notification was moved to the dead letter queue (if applicable)
   */
  deadLetterQueuedAt?: Date;
  
  /**
   * Reason for moving to the dead letter queue (if applicable)
   */
  deadLetterReason?: string;
  
  /**
   * Fallback channels that were attempted if the primary channel failed
   */
  fallbackChannelsAttempted?: string[];
  
  /**
   * Metadata for the notification delivery
   * This can include journey-specific data, device information,
   * or other contextual information relevant to the notification
   */
  metadata?: Record<string, any>;
  
  /**
   * Reference to the original notification payload
   * This allows tracking the original content that was attempted to be delivered
   */
  originalPayload?: INotificationBase;
}

/**
 * Represents metrics collected about notification delivery performance
 * 
 * These metrics are used for monitoring, reporting, and improving the notification
 * delivery system. They provide insights into delivery performance, error rates,
 * and patterns across different channels and notification types.
 * 
 * The metrics are collected at the end of a notification's lifecycle (either after
 * successful delivery or when all retry attempts are exhausted).
 */
export interface IDeliveryMetrics {
  /**
   * Unique identifier for the notification
   */
  notificationId: number | string;
  
  /**
   * Delivery channel
   */
  channel: string;
  
  /**
   * Total time from creation to final delivery status (success or permanent failure)
   */
  totalDeliveryTimeMs: number;
  
  /**
   * Time from creation to first delivery attempt
   */
  timeToFirstAttemptMs: number;
  
  /**
   * Number of delivery attempts made
   */
  attemptCount: number;
  
  /**
   * Final delivery status
   */
  finalStatus: DeliveryStatus;
  
  /**
   * Whether fallback channels were used
   */
  usedFallbackChannels: boolean;
  
  /**
   * Journey context for the notification
   */
  journeyContext?: string;
  
  /**
   * Notification type
   */
  notificationType: string;
  
  /**
   * Notification priority
   */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  
  /**
   * Error category if delivery failed
   */
  errorCategory?: DeliveryErrorCategory;
  
  /**
   * Timestamp when metrics were collected
   */
  collectedAt: Date;
  
  /**
   * Channel-specific metrics
   */
  channelMetrics?: Record<string, any>;
}

/**
 * Represents a request to update the delivery status of a notification
 * 
 * This interface is used when updating the delivery status of a notification,
 * either from internal processes or from external delivery providers that
 * support delivery receipts or webhooks (e.g., email delivery confirmations,
 * SMS delivery receipts).
 */
export interface IDeliveryStatusUpdate {
  /**
   * New status to set
   */
  status: DeliveryStatus;
  
  /**
   * Reason for the status update
   */
  reason?: string;
  
  /**
   * Provider-specific status details
   */
  providerDetails?: Record<string, any>;
  
  /**
   * Timestamp when the status change occurred
   */
  timestamp: Date;
  
  /**
   * Information about the delivery attempt that triggered this update
   */
  attemptInfo?: Partial<IDeliveryAttempt>;
}

/**
 * Represents a summary of delivery status for reporting and dashboards
 * 
 * This interface aggregates delivery metrics across multiple notifications
 * for a specific time period. It's used for generating reports, populating
 * dashboards, and monitoring overall system performance.
 * 
 * The summary helps identify patterns, bottlenecks, and areas for improvement
 * in the notification delivery system.
 */
export interface IDeliveryStatusSummary {
  /**
   * Total number of notifications
   */
  total: number;
  
  /**
   * Count of notifications by status
   */
  byStatus: Record<DeliveryStatus, number>;
  
  /**
   * Count of notifications by channel
   */
  byChannel: Record<string, number>;
  
  /**
   * Count of notifications by error category
   */
  byErrorCategory: Record<DeliveryErrorCategory, number>;
  
  /**
   * Average delivery time in milliseconds
   */
  avgDeliveryTimeMs: number;
  
  /**
   * Success rate (percentage of notifications successfully delivered)
   */
  successRate: number;
  
  /**
   * Percentage of notifications that required retries
   */
  retryRate: number;
  
  /**
   * Percentage of notifications that used fallback channels
   */
  fallbackRate: number;
  
  /**
   * Time period for this summary
   */
  period: {
    start: Date;
    end: Date;
  };
}