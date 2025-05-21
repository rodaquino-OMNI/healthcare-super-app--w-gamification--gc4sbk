/**
 * Delivery Tracking Interfaces
 * 
 * This file defines interfaces for tracking notification delivery status across different channels,
 * supporting enhanced retry policies and delivery monitoring. These interfaces enable robust tracking
 * of notification lifecycle from dispatch through delivery or failure.
 * 
 * Part of the AUSTA SuperApp refactoring to implement standardized delivery tracking across
 * all notification channels with support for retry mechanisms and dead letter queues.
 */

import { NotificationType } from '@austa/interfaces/notification';

/**
 * Represents the current status of a notification delivery attempt
 */
export enum DeliveryStatusType {
  PENDING = 'pending',      // Initial state, not yet attempted
  PROCESSING = 'processing', // Currently being processed
  SENT = 'sent',           // Successfully sent to the delivery provider
  DELIVERED = 'delivered',  // Confirmed delivered to the recipient
  FAILED = 'failed',        // Failed to deliver
  RETRYING = 'retrying',    // Failed but will be retried
  DROPPED = 'dropped',      // Permanently failed, will not be retried
  QUEUED_DLQ = 'queued_dlq' // Moved to dead letter queue for manual processing
}

/**
 * Represents the delivery channel for a notification
 */
export enum DeliveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in-app'
}

/**
 * Interface for tracking a single delivery attempt
 */
export interface IDeliveryAttempt {
  /**
   * Unique identifier for this delivery attempt
   */
  attemptId: string;
  
  /**
   * Timestamp when this attempt was initiated
   */
  timestamp: Date;
  
  /**
   * Current status of this attempt
   */
  status: DeliveryStatusType;
  
  /**
   * The channel used for this attempt
   */
  channel: DeliveryChannel;
  
  /**
   * Provider-specific response code (if available)
   */
  providerResponseCode?: string;
  
  /**
   * Provider-specific response message (if available)
   */
  providerResponseMessage?: string;
  
  /**
   * Error information if the attempt failed
   */
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  
  /**
   * Retry information if this is a retry attempt
   */
  retry?: {
    /**
     * Number of this attempt (1-based)
     */
    attemptNumber: number;
    
    /**
     * Delay before this retry in milliseconds
     */
    delayMs: number;
    
    /**
     * Strategy used for this retry (e.g., 'exponential', 'linear', 'fixed')
     */
    strategy: string;
  };
}

/**
 * Interface for tracking the current delivery status of a notification
 */
export interface IDeliveryStatus {
  /**
   * Current overall status of the notification delivery
   */
  status: DeliveryStatusType;
  
  /**
   * Timestamp when the notification was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the notification was last updated
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
   * Channel-specific delivery statuses
   */
  channelStatus: {
    [channel in DeliveryChannel]?: {
      status: DeliveryStatusType;
      lastAttemptAt?: Date;
      attemptCount: number;
    };
  };
  
  /**
   * Dead letter queue information if the notification was moved to DLQ
   */
  dlq?: {
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
  };
}

/**
 * Interface for comprehensive delivery tracking of a notification
 * 
 * Provides a complete history and current state of a notification's delivery process,
 * including all attempts, retry policies, and cross-service correlation.
 */
export interface IDeliveryTracking {
  /**
   * Unique identifier for the notification
   */
  notificationId: number | string;
  
  /**
   * Transaction ID for cross-service correlation
   * Used to track the notification across different services and systems
   */
  transactionId: string;
  
  /**
   * ID of the user who will receive this notification
   */
  userId: string;
  
  /**
   * Journey context for this notification (health, care, plan, game)
   * Used to apply journey-specific handling and policies
   */
  journeyContext: string;
  
  /**
   * Current delivery status
   */
  status: IDeliveryStatus;
  
  /**
   * History of all delivery attempts
   */
  attempts: IDeliveryAttempt[];
  
  /**
   * Fallback channels to try if primary channel fails
   * Listed in order of preference
   */
  fallbackChannels?: DeliveryChannel[];
  
  /**
   * Retry policy configuration
   */
  retryPolicy: {
    /**
     * Maximum number of retry attempts
     */
    maxRetries: number;
    
    /**
     * Base delay between retries in milliseconds
     */
    baseDelayMs: number;
    
    /**
     * Maximum delay between retries in milliseconds
     */
    maxDelayMs: number;
    
    /**
     * Retry strategy (e.g., 'exponential', 'linear', 'fixed')
     */
    strategy: string;
    
    /**
     * Factor for exponential backoff (if using exponential strategy)
     */
    backoffFactor?: number;
  };
}

/**
 * Interface for tracking delivery metrics
 * 
 * Aggregates statistics about notification delivery performance across channels and types.
 * Used for monitoring, reporting, and identifying delivery issues.
 */
export interface IDeliveryMetrics {
  /**
   * Total number of notifications processed
   */
  totalProcessed: number;
  
  /**
   * Number of successfully delivered notifications
   */
  delivered: number;
  
  /**
   * Number of failed notifications
   */
  failed: number;
  
  /**
   * Number of notifications in retry state
   */
  retrying: number;
  
  /**
   * Number of notifications moved to dead letter queue
   */
  inDeadLetterQueue: number;
  
  /**
   * Average delivery time in milliseconds
   */
  avgDeliveryTimeMs: number;
  
  /**
   * Average number of attempts per notification
   */
  avgAttempts: number;
  
  /**
   * Success rate as a percentage
   */
  successRate: number;
  
  /**
   * Metrics broken down by channel
   */
  channelMetrics: {
    [channel in DeliveryChannel]?: {
      totalProcessed: number;
      delivered: number;
      failed: number;
      retrying: number;
      avgDeliveryTimeMs: number;
      successRate: number;
    };
  };
  
  /**
   * Metrics broken down by notification type
   */
  typeMetrics: {
    [type in NotificationType]?: {
      totalProcessed: number;
      delivered: number;
      failed: number;
      retrying: number;
      avgDeliveryTimeMs: number;
      successRate: number;
    };
  };
}