import { ErrorType } from '../constants/error-types.constants';
import { RetryStatus } from './retry-status.enum';

/**
 * Interface representing a retry attempt in the retry history.
 */
export interface IRetryAttempt {
  /**
   * Timestamp when the retry attempt was made
   */
  timestamp: Date;

  /**
   * Error message from the failed attempt
   */
  errorMessage: string;

  /**
   * Status of the retry attempt
   */
  status: RetryStatus;

  /**
   * Duration of the retry attempt in milliseconds
   */
  duration?: number;

  /**
   * Additional context about the retry attempt
   */
  context?: Record<string, any>;
}

/**
 * Interface representing an entry in the dead-letter queue (DLQ) for failed notification operations
 * that have exhausted their retry attempts.
 * 
 * DLQ entries contain comprehensive information about the failed notification, including the original
 * payload, error details, retry history, and metadata. This information is essential for:
 * 
 * 1. Debugging and troubleshooting notification failures
 * 2. Analyzing patterns in notification failures
 * 3. Supporting manual reprocessing of failed notifications
 * 4. Providing audit trails for notification delivery attempts
 */
export interface IDlqEntry {
  /**
   * Unique identifier for the DLQ entry
   */
  id: string;

  /**
   * ID of the notification that failed
   */
  notificationId: string;

  /**
   * ID of the user who was the intended recipient of the notification
   */
  userId: string;

  /**
   * Delivery channel that failed (e.g., 'push', 'email', 'sms', 'in-app')
   */
  channel: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment-reminder', 'claim-status')
   */
  type: string;

  /**
   * Notification title/headline
   */
  title: string;

  /**
   * Original payload that was being processed when the failure occurred
   */
  payload: Record<string, any>;

  /**
   * Detailed information about the error that caused the notification to be moved to the DLQ
   */
  errorDetails: {
    /**
     * Classification of the error (CLIENT, SYSTEM, TRANSIENT, EXTERNAL)
     */
    type: ErrorType;

    /**
     * Error message
     */
    message: string;

    /**
     * Error stack trace for debugging
     */
    stack?: string;

    /**
     * Error code or reason code for categorization
     */
    code?: string;

    /**
     * Additional context about the error
     */
    context?: Record<string, any>;
  };

  /**
   * History of retry attempts made before the notification was moved to the DLQ
   */
  retryHistory: IRetryAttempt[];

  /**
   * Maximum number of retry attempts that were configured for this notification
   */
  maxRetries: number;

  /**
   * Current status of the DLQ entry
   */
  status: 'pending' | 'resolved' | 'reprocessed' | 'ignored';

  /**
   * Optional comments added during manual resolution
   */
  resolutionComments?: string;

  /**
   * Timestamp when the entry was resolved or reprocessed (if applicable)
   */
  resolvedAt?: Date;

  /**
   * User ID of the administrator who resolved the entry (if applicable)
   */
  resolvedBy?: string;

  /**
   * Journey context information (health, care, plan) for analytics and filtering
   */
  journeyContext?: {
    /**
     * Journey type (health, care, plan)
     */
    journey: 'health' | 'care' | 'plan';
    
    /**
     * Journey-specific context data
     */
    data?: Record<string, any>;
  };

  /**
   * Timestamp when the DLQ entry was created
   */
  createdAt: Date;

  /**
   * Timestamp when the DLQ entry was last updated
   */
  updatedAt: Date;
}